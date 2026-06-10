package fcm

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

var client *messaging.Client

// Init initializes Firebase Admin SDK. Call once at startup.
func Init() {
	credFile := os.Getenv("FIREBASE_CREDENTIALS_FILE")
	if credFile == "" {
		log.Println("[FCM] FIREBASE_CREDENTIALS_FILE not set, FCM disabled")
		return
	}

	opt := option.WithCredentialsFile(credFile)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Printf("[FCM] Failed to initialize Firebase app: %v", err)
		return
	}

	c, err := app.Messaging(context.Background())
	if err != nil {
		log.Printf("[FCM] Failed to get Messaging client: %v", err)
		return
	}

	client = c
	log.Println("[FCM] Firebase Admin SDK initialized")
}

// SendToToken sends a notification to a single FCM token.
func SendToToken(token, title, body string, data map[string]string) error {
	if client == nil {
		return nil
	}
	msg := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Sound: "default",
			},
		},
		APNS: &messaging.APNSConfig{
			Payload: &messaging.APNSPayload{
				Aps: &messaging.Aps{
					Sound: "default",
				},
			},
		},
	}
	if len(data) > 0 {
		msg.Data = data
	}

	_, err := client.Send(context.Background(), msg)
	return err
}

// SendMulticast sends a notification to multiple FCM tokens (max 500).
func SendMulticast(tokens []string, title, body string, data map[string]string) error {
	if client == nil || len(tokens) == 0 {
		return nil
	}

	msg := &messaging.MulticastMessage{
		Tokens: tokens,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Sound: "default",
			},
		},
		APNS: &messaging.APNSConfig{
			Payload: &messaging.APNSPayload{
				Aps: &messaging.Aps{
					Sound: "default",
				},
			},
		},
	}
	if len(data) > 0 {
		msg.Data = data
	}

	resp, err := client.SendEachForMulticast(context.Background(), msg)
	if err != nil {
		return err
	}
	if resp.FailureCount > 0 {
		log.Printf("[FCM] %d messages failed out of %d", resp.FailureCount, len(tokens))
	}
	return nil
}
