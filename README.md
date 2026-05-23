# Atlas

Atlas is a Swiss insurance intelligence SaaS built with Next.js App Router,
TypeScript, Tailwind, Supabase Auth/Storage, and AI-assisted policy extraction.

## Environment

Create a root `.env.local` file with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

OPENAI_API_KEY=your-openai-api-key
OPENAI_POLICY_EXTRACTION_MODEL=gpt-5.2
```

`OPENAI_API_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## AI extraction

Document analysis uses OpenAI structured outputs first and automatically falls
back to the mock extractor when a PDF does not contain enough readable text for
non-OCR extraction.

The extraction flow keeps API keys on the server, downloads private PDFs from
Supabase Storage server-side, extracts readable PDF text when possible, and
saves the generated policy as an `ai_draft` that requires review.

## Useful commands

```bash
npm run lint
npm run build
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
