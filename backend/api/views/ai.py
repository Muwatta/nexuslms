import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# optional import for OpenAI if installed
try:
    import openai
except ImportError:
    openai = None

class AIView(APIView):
    """Simple AI assistant endpoint.
    POST with JSON body {"prompt": "..."} returns {"response": "..."}.
    If OPENAI_API_KEY is set in the environment and the openai package
    is available, the prompt will be sent to OpenAI's completion API.
    Otherwise the endpoint echoes the prompt back as a stubbed reply.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get("prompt", "").strip()
        if not prompt:
            return Response({"error": "No prompt provided"}, status=400)

        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key and openai is not None:
            try:
                openai.api_key = api_key
                completion = openai.Completion.create(
                    engine="text-davinci-003",
                    prompt=prompt,
                    max_tokens=150,
                    temperature=0.7,
                )
                text = completion.choices[0].text.strip()
            except Exception as e:
                text = f"(error calling OpenAI: {e})"
        else:
            # fallback stub
            text = f"AI echo: {prompt}"

        return Response({"response": text})
