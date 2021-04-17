interface inputEvent {
  input: string;
  name: string;
}

export const handler = async (event: inputEvent): Promise<string> => {
  return JSON.stringify({ output: event.input, user: event.name });
};
