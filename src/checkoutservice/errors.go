package main

import (
	pb "github.com/GoogleCloudPlatform/microservices-demo/src/checkoutservice/genproto"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func serviceError(code codes.Code, errCode pb.ErrorCode, msg, originService string) error {
	st := status.New(code, msg)
	st, err := st.WithDetails(&pb.ServiceError{
		ErrorCode:     errCode,
		Message:       msg,
		OriginService: originService,
	})
	if err != nil {
		return status.Error(code, msg)
	}
	return st.Err()
}
