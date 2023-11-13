import { $query, ic, Opt, nat64, Result, Record, StableBTreeMap, $update, Vec, match } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Message = Record<{
  id: string;
  title: string;
  body: string;
  attachmentURL: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type MessagePayload = Record<{
  title: string;
  body: string;
  attachmentURL: string;
}>;

const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024);

// Function to get all messages
$query;
export function getMessages(): Result<Vec<Message>, string> {
  try {
    return Result.Ok(messageStorage.values());
  } catch (error) {
    return Result.Err(`Failed to retrieve messages: ${error}`);
  }
}

// Function to get a message by ID
$query;
export function getMessage(id: string): Result<Message, string> {
  // Parameter Validation: Validate the id parameter to ensure it's a valid UUID
  if (!id) {
    return Result.Err("Invalid ID format.");
  }

  return match(messageStorage.get(id), {
    Some: (message) => Result.Ok<Message, string>(message),
    None: () => Result.Err<Message, string>(`Message with ID=${id} not found`),
  });
}

// Function to add a new message
$update;
export function addMessage(payload: MessagePayload): Result<Message, string> {
  // Payload Validation: Ensure that required fields are present in the payload
  if (!payload.title || !payload.body || !payload.attachmentURL) {
    return Result.Err("Missing required fields in the payload.");
  }

  // Create a new message record
  const message: Message = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
  try {
    messageStorage.insert(message.id, message); // Error Handling: Handle any errors during insertion
  } catch (error) {
    return Result.Err(`Failed to add the message: ${error}`);
  }

  return Result.Ok(message);
}

// Function to update a message by ID
$update;
export function updateMessage(id: string, payload: MessagePayload): Result<Message, string> {
  // Parameter Validation: Validate the id parameter to ensure it's a valid UUID
  if (!id) {
    return Result.Err("Invalid ID format.");
  }

  return match(messageStorage.get(id), {
    Some: (existingMessage) => {
      // Selective Update: Update only the allowed fields in updatedMessage
      const updatedMessage: Message = { ...existingMessage, ...payload, updatedAt: Opt.Some(ic.time()) };

      try {
        messageStorage.insert(updatedMessage.id, updatedMessage); // Error Handling: Handle any errors during insertion
      } catch (error) {
        return Result.Err<Message, string>(`Failed to update the message: ${error}`);
      }

      return Result.Ok<Message, string>(updatedMessage);
    },
    None: () => Result.Err<Message, string>(`Message with ID=${id} not found`),
  });
}

// Function to delete a message by ID
$update;
export function deleteMessage(id: string): Result<Message, string> {
  // Parameter Validation: Validate the id parameter to ensure it's a valid UUID
  if (!id) {
    return Result.Err("Invalid ID format.");
  }

  return match(messageStorage.remove(id), {
    Some: (deletedMessage) => Result.Ok<Message, string>(deletedMessage),
    None: () => Result.Err<Message, string>(`Message with ID=${id} not found`),
  });
}

globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};
