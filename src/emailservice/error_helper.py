# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from grpc_status import rpc_status
from google.rpc import status_pb2
from google.protobuf import any_pb2
import demo_pb2
import grpc


def abort_with_service_error(context, grpc_code, error_code, message, service):
    detail = demo_pb2.ServiceError(
        error_code=error_code,
        message=message,
        service=service,
    )
    any_detail = any_pb2.Any()
    any_detail.Pack(detail)
    rich_status = status_pb2.Status(
        code=grpc_code.value[0],
        message=message,
        details=[any_detail],
    )
    context.abort_with_status(rpc_status.to_status(rich_status))
