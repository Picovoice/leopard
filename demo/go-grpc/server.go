package main

import (
    "flag"
    "fmt"
    leopard "github.com/Picovoice/leopard/binding/go"
    "github.com/google/uuid"
    "google.golang.org/grpc"
    "io"
    "leopardgogrpc/messaging"
    "log"
    "net"
    "os"
)

var (
    accessKeyArg = flag.String("access_key", "", "AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
    port         = flag.Int("port", 5050, "The server port")
)

type leopardServer struct {
    accessKey string
}

func (s *leopardServer) GetTranscriptionFile(stream messaging.LeopardService_GetTranscriptionFileServer) (err error) {
    id := uuid.New()
    is_done := false

    log.Printf("Received a new request (ID: %s)", id.String())
    defer log.Printf("Returned a response to the request (ID: %s)", id.String())
    engine := leopard.NewLeopard(s.accessKey)
    error := engine.Init()
    if error != nil {
        log.Printf("Failed to initialize: %v\n", err)
        is_done = true
    }
    defer engine.Delete()

    var audio []byte = make([]byte, 0)
    var res leopard.LeopardTranscript
    var statusCode messaging.StatusCode = messaging.StatusCode_Failed

    for !is_done {
        audioFileChunk, err := stream.Recv()
        if err == io.EOF {
            f, err := os.CreateTemp("", "sample")
            if err != nil {
                log.Fatalf("Failed to create a temp file: %v\n", err)
                break
            }
            defer os.Remove(f.Name())
            _, err = f.Write(audio)
            if err != nil {
                log.Printf("Failed to write into the temp file: %v\n", err)
                break
            }
            res, err = engine.ProcessFile(f.Name())
            if err != nil {
                log.Printf("Failed to transcript the audio: %v\n", err)
                break
            }
            statusCode = messaging.StatusCode_Ok
            is_done = true
        } else {
            audio = append(audio, audioFileChunk.Content...)
        }
    }
    return stream.SendAndClose(&messaging.TranscriptResponse{
        Transcript: res.Transcript,
        Code:       statusCode,
    })
}

func newServer(accessKey string) *leopardServer {
    return &leopardServer{accessKey: accessKey}
}

func main() {
    flag.Parse()

    if *accessKeyArg == "" {
        log.Fatalln("No AccessKey provided.")
    }
    add := fmt.Sprintf("localhost:%d", *port)
    lis, err := net.Listen("tcp", add)
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    fmt.Printf("Server is listening on %v ...\n", add)

    grpcServer := grpc.NewServer()

    messaging.RegisterLeopardServiceServer(grpcServer, newServer(*accessKeyArg))

    grpcServer.Serve(lis)
}
