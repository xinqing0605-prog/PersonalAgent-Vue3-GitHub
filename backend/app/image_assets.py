"""Account-owned image files used by chat, clipboard and Markdown notes."""
from __future__ import annotations

import base64
import hashlib
import http.client
import io
import ipaddress
import os
import re
import socket
import ssl
import tempfile
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from PIL import Image, UnidentifiedImageError

from .user_storage import user_root

MAX_IMAGE_BYTES = 16_000_000
IMAGE_ID = re.compile(r"[a-f0-9]{64}\.(?:png|jpg|webp)")
LOCAL_IMAGE = re.compile(r"/api/images/([a-f0-9]{64}\.(?:png|jpg|webp))")


def image_path(image_id: str, user_id: int) -> Path:
    if not IMAGE_ID.fullmatch(image_id):
        raise ValueError("图片标识无效。")
    return user_root(user_id) / "images" / image_id


def validate_image(data: bytes) -> str:
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise ValueError("图片不能为空且不能超过 16 MB。")
    try:
        with Image.open(io.BytesIO(data)) as image:
            extension = {"PNG": "png", "JPEG": "jpg", "WEBP": "webp"}.get(image.format)
            if not extension or image.width * image.height > 25_000_000:
                raise ValueError("请选择不超过 2500 万像素的 PNG、JPG 或 WebP 图片。")
            image.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("图片数据损坏或格式不受支持。") from exc
    return extension


def _public_target(url: str) -> tuple[str, str, str]:
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password
            or parsed.port not in (None, 443)):
        raise ValueError("图片地址必须是公开的 HTTPS 地址。")
    hostname = parsed.hostname.encode("idna").decode("ascii")
    addresses = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
        raise ValueError("不能读取本机或内网图片地址。")
    target = parsed.path or "/"
    if parsed.query:
        target += "?" + parsed.query
    return hostname, addresses[0][4][0], target


class _PinnedHTTPSConnection(http.client.HTTPSConnection):
    """Use the validated public IP, retaining the hostname for TLS and Host."""
    def __init__(self, hostname: str, address: str):
        super().__init__(hostname, timeout=25, context=ssl.create_default_context())
        self.address = address

    def connect(self):
        connection = socket.create_connection((self.address, 443), timeout=self.timeout)
        try:
            self.sock = self._context.wrap_socket(connection, server_hostname=self.host)
        except Exception:
            connection.close()
            raise


def download_image(url: str) -> bytes:
    for _ in range(4):
        hostname, address, target = _public_target(url)
        connection = _PinnedHTTPSConnection(hostname, address)
        try:
            # No account credentials, cookies or provider API keys go to image hosts.
            connection.request("GET", target, headers={"Accept": "image/png,image/jpeg,image/webp"})
            response = connection.getresponse()
            if response.status in (301, 302, 303, 307, 308):
                location = response.getheader("Location")
                if not location:
                    raise ValueError("图片地址重定向无效。")
                url = urljoin(url, location)
                continue
            if response.status != 200:
                raise ValueError(f"读取图片失败（HTTP {response.status}），图片链接可能已过期。")
            data = response.read(MAX_IMAGE_BYTES + 1)
            if len(data) > MAX_IMAGE_BYTES:
                raise ValueError("图片不能超过 16 MB。")
            return data
        finally:
            connection.close()
    raise ValueError("图片地址重定向次数过多。")


def store_image(source: str, user_id: int) -> str:
    local = LOCAL_IMAGE.fullmatch(source)
    if local:
        if not image_path(local[1], user_id).is_file():
            raise FileNotFoundError("图片不存在或不属于当前账户。")
        return source
    if source.startswith("data:"):
        header, separator, encoded = source.partition(",")
        if not separator or header.lower() not in {"data:image/png;base64", "data:image/jpeg;base64", "data:image/webp;base64"}:
            raise ValueError("图片格式不受支持。")
        try:
            data = base64.b64decode(encoded, validate=True)
        except ValueError as exc:
            raise ValueError("图片编码无效。") from exc
    else:
        data = download_image(source)
    extension = validate_image(data)
    image_id = f"{hashlib.sha256(data).hexdigest()}.{extension}"
    path = image_path(image_id, user_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        # Publish complete files atomically, including simultaneous imports.
        descriptor, temporary = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
        try:
            with os.fdopen(descriptor, "wb") as output:
                output.write(data)
            os.replace(temporary, path)
        finally:
            Path(temporary).unlink(missing_ok=True)
    return f"/api/images/{image_id}"
