from google.rpc import status_pb2
from google.protobuf import any_pb2
from grpc_status import rpc_status
import grpc

import demo_pb2


def abort_with_service_error(context, grpc_code, error_code, message, origin_service):
    """Abort a gRPC call with a structured ServiceError detail."""
    service_error = demo_pb2.ServiceError(
        error_code=error_code,
        message=message,
        origin_service=origin_service,
    )

    detail = any_pb2.Any()
    detail.Pack(service_error)

    rich_status = status_pb2.Status(
        code=grpc_code.value[0],
        message=message,
        details=[detail],
    )

    context.abort_with_status(rpc_status.to_status(rich_status))
