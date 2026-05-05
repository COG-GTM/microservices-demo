// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using Google.Protobuf;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Hipstershop;

namespace cartservice.errors;

public static class ServiceErrorHelper
{
    public static RpcException Create(StatusCode code, string errorCode, string message)
    {
        var serviceError = new ServiceError
        {
            ErrorCode = errorCode,
            Message = message,
            Service = "cartservice"
        };

        var rpcStatus = new Google.Rpc.Status
        {
            Code = (int)code,
            Message = message,
        };
        rpcStatus.Details.Add(Any.Pack(serviceError));

        var metadata = new Metadata
        {
            { "grpc-status-details-bin", rpcStatus.ToByteArray() }
        };

        return new RpcException(new Status(code, message), metadata);
    }
}
