const grpc = require('@grpc/grpc-js');

// ErrorCode enum values matching demo.proto
const ErrorCode = {
  ERROR_CODE_UNSPECIFIED: 0,
  PRODUCT_NOT_FOUND: 1,
  CART_NOT_FOUND: 2,
  INVALID_CREDIT_CARD: 3,
  EXPIRED_CREDIT_CARD: 4,
  UNACCEPTED_CREDIT_CARD: 5,
  INVALID_CURRENCY: 6,
  INVALID_REQUEST: 7,
  STORAGE_UNAVAILABLE: 8,
  DOWNSTREAM_SERVICE_UNAVAILABLE: 9,
  PAYMENT_FAILED: 10,
  SHIPPING_FAILED: 11,
  EMAIL_DELIVERY_FAILED: 12,
};

/**
 * Manually encode a protobuf varint.
 */
function encodeVarint(value) {
  const bytes = [];
  while (value > 0x7f) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7f);
  return Buffer.from(bytes);
}

/**
 * Manually encode a protobuf length-delimited field.
 */
function encodeLengthDelimited(fieldNumber, data) {
  const tag = encodeVarint((fieldNumber << 3) | 2);
  const len = encodeVarint(data.length);
  return Buffer.concat([tag, len, data]);
}

/**
 * Manually encode a protobuf varint field.
 */
function encodeVarintField(fieldNumber, value) {
  if (value === 0) return Buffer.alloc(0);
  const tag = encodeVarint((fieldNumber << 3) | 0);
  const val = encodeVarint(value);
  return Buffer.concat([tag, val]);
}

/**
 * Encode a ServiceError message in protobuf binary format.
 */
function encodeServiceError(errorCode, message, originService) {
  const parts = [];
  // field 1: error_code (enum/int32)
  if (errorCode !== 0) parts.push(encodeVarintField(1, errorCode));
  // field 2: message (string)
  if (message) parts.push(encodeLengthDelimited(2, Buffer.from(message, 'utf8')));
  // field 3: origin_service (string)
  if (originService) parts.push(encodeLengthDelimited(3, Buffer.from(originService, 'utf8')));
  return Buffer.concat(parts);
}

/**
 * Encode a google.protobuf.Any message.
 */
function encodeAny(typeUrl, value) {
  const parts = [];
  if (typeUrl) parts.push(encodeLengthDelimited(1, Buffer.from(typeUrl, 'utf8')));
  if (value && value.length > 0) parts.push(encodeLengthDelimited(2, value));
  return Buffer.concat(parts);
}

/**
 * Encode a google.rpc.Status message.
 */
function encodeRpcStatus(code, message, details) {
  const parts = [];
  if (code !== 0) parts.push(encodeVarintField(1, code));
  if (message) parts.push(encodeLengthDelimited(2, Buffer.from(message, 'utf8')));
  for (const detail of details) {
    parts.push(encodeLengthDelimited(3, detail));
  }
  return Buffer.concat(parts);
}

/**
 * Creates a gRPC error with ServiceError details encoded in trailing metadata.
 * @param {number} grpcCode - gRPC status code (e.g., grpc.status.INVALID_ARGUMENT)
 * @param {number} errorCode - ErrorCode enum value
 * @param {string} message - Human-readable error message
 * @param {string} originService - Name of the service originating the error
 * @returns {Object} gRPC error object with metadata
 */
function createServiceError(grpcCode, errorCode, message, originService) {
  const serviceErrorBuf = encodeServiceError(errorCode, message, originService);
  const anyBuf = encodeAny('type.googleapis.com/hipstershop.ServiceError', serviceErrorBuf);
  const statusBuf = encodeRpcStatus(grpcCode, message, [anyBuf]);

  const metadata = new grpc.Metadata();
  metadata.add('grpc-status-details-bin', statusBuf);

  return {
    code: grpcCode,
    message: message,
    metadata: metadata,
  };
}

module.exports = { createServiceError, ErrorCode };
