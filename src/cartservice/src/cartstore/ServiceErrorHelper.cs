using Grpc.Core;
using Google.Protobuf;
using Google.Protobuf.WellKnownTypes;
using Hipstershop;

namespace cartservice.cartstore
{
    public static class ServiceErrorHelper
    {
        public static RpcException CreateServiceError(StatusCode grpcCode, ErrorCode errorCode, string message, string originService)
        {
            var serviceError = new ServiceError
            {
                ErrorCode = errorCode,
                Message = message,
                OriginService = originService
            };

            var rpcStatus = new Google.Rpc.Status
            {
                Code = (int)grpcCode,
                Message = message,
            };
            rpcStatus.Details.Add(Any.Pack(serviceError));

            var metadata = new Metadata
            {
                { "grpc-status-details-bin", rpcStatus.ToByteArray() }
            };

            return new RpcException(new Status(grpcCode, message), metadata);
        }
    }
}
