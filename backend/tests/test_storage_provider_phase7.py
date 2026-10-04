from pathlib import Path

import boto3
import pytest
from moto import mock_aws
from rq.serializers import JSONSerializer

from app.storage import LocalStorageProvider, S3StorageProvider


def _contract(provider) -> None:
    stored = provider.put_bytes("datasets/example.csv", b"x,y\n1,2\n")
    assert stored.size == 8
    assert provider.get_bytes("datasets/example.csv") == b"x,y\n1,2\n"
    assert provider.list("datasets") == [stored]
    provider.delete("datasets/example.csv")
    assert provider.list() == []


def test_local_storage_contract_and_path_safety(tmp_path: Path) -> None:
    _contract(LocalStorageProvider(tmp_path / "managed"))
    with pytest.raises(ValueError):
        LocalStorageProvider(tmp_path / "managed").put_bytes("../escape", b"bad")


@mock_aws
def test_s3_storage_contract_with_moto() -> None:
    boto3.client("s3", region_name="us-east-1").create_bucket(Bucket="energy-test")
    provider = S3StorageProvider(bucket="energy-test", region="us-east-1", endpoint_url="", access_key="testing", secret_key="testing")
    _contract(provider)


def test_rq_json_serializer_never_uses_pickle() -> None:
    encoded = JSONSerializer.dumps({"task_id": 7})
    assert JSONSerializer.loads(encoded) == {"task_id": 7}
    assert not encoded.startswith(b"\x80")
