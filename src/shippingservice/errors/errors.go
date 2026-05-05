package errors

import (
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/GoogleCloudPlatform/microservices-demo/src/shippingservice/genproto"
)

func NewServiceError(code codes.Code, errCode, msg, svc string) error {
	st, err := status.New(code, msg).WithDetails(&pb.ServiceError{
		ErrorCode: errCode,
		Message:   msg,
		Service:   svc,
	})
	if err != nil {
		return status.Errorf(code, msg)
	}
	return st.Err()
}
