/*
 * Copyright 2024 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const protobuf = require('protobufjs');
const grpc = require('@grpc/grpc-js');

const PROTO_PATH = path.join(__dirname, './proto/demo.proto');

// Load proto with protobufjs to get actual Type instances with encode/decode
const root = protobuf.loadSync(PROTO_PATH);
const ServiceErrorType = root.lookupType('hipstershop.ServiceError');

// Define google.rpc.Status and google.protobuf.Any inline
// (avoids needing to locate the googleapis proto files on disk)
const statusRoot = new protobuf.Root();
statusRoot.define('google.protobuf').add(
  new protobuf.Type('Any')
    .add(new protobuf.Field('type_url', 1, 'string'))
    .add(new protobuf.Field('value', 2, 'bytes'))
);
statusRoot.define('google.rpc').add(
  new protobuf.Type('Status')
    .add(new protobuf.Field('code', 1, 'int32'))
    .add(new protobuf.Field('message', 2, 'string'))
    .add(new protobuf.Field('details', 3, 'google.protobuf.Any', 'repeated'))
);
const RpcStatusType = statusRoot.lookupType('google.rpc.Status');
const AnyType = statusRoot.lookupType('google.protobuf.Any');

/**
 * Creates a gRPC error callback object with a properly encoded
 * google.rpc.Status containing a ServiceError detail in grpc-status-details-bin.
 *
 * @param {number} grpcCode - gRPC status code (e.g. grpc.status.INVALID_ARGUMENT)
 * @param {string} errorCode - Application error code (e.g. 'INVALID_CREDIT_CARD')
 * @param {string} message - Human-readable error message
 * @param {string} service - Service name
 * @returns {object} Error object suitable for passing to a gRPC callback
 */
function createServiceError(grpcCode, errorCode, message, service) {
  const serviceError = ServiceErrorType.create({
    error_code: errorCode,
    message: message,
    service: service,
    field_violations: []
  });
  const encodedServiceError = ServiceErrorType.encode(serviceError).finish();

  const anyDetail = AnyType.create({
    type_url: 'type.googleapis.com/hipstershop.ServiceError',
    value: encodedServiceError
  });

  const rpcStatus = RpcStatusType.create({
    code: grpcCode,
    message: message,
    details: [anyDetail]
  });
  const encodedStatus = RpcStatusType.encode(rpcStatus).finish();

  const metadata = new grpc.Metadata();
  metadata.add('grpc-status-details-bin', Buffer.from(encodedStatus));

  return {
    code: grpcCode,
    message: message,
    metadata: metadata
  };
}

module.exports = { createServiceError };
