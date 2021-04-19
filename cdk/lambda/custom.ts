interface inputEvent {
  input: string;
}

export const handler = async (event: inputEvent): Promise<string> => {
  return event.input;
};
