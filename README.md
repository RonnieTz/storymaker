# StoryMaker - AI-Powered Interactive Storytelling

StoryMaker is a Next.js application that allows users to create interactive stories with AI assistance. Users can start with a simple prompt and collaborate with OpenAI's GPT to build engaging, dynamic narratives.

## Features

- **User Authentication**: Secure sign-up and sign-in with NextAuth.js
- **AI Story Generation**: OpenAI integration for story creation and continuation
- **Interactive Storytelling**: Choose from AI suggestions or provide custom directions
- **Story Management**: Save, view, and continue stories
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-3.5-turbo

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- OpenAI API key

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd storymaker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/storymaker
   # or your MongoDB Atlas connection string
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/storymaker

   # NextAuth
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # OpenAI
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Generate a secure NextAuth secret:

   ```bash
   openssl rand -base64 32
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up/Sign In**: Create an account or sign in to access the dashboard
2. **Create a Story**: Click "Create New Story" and provide an initial prompt
3. **Continue Your Story**: Choose from AI suggestions or write custom directions
4. **Manage Stories**: View all your stories from the dashboard

## Story Flow

1. User provides an initial prompt (e.g., "A detective finds a mysterious letter")
2. AI generates the first 200-300 words of the story
3. AI provides 3-5 suggestions for continuation
4. User selects a suggestion or provides custom input
5. AI generates the next 500-1000 words
6. Process repeats until the story is complete

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/stories` - Create or continue stories
- `GET /api/stories` - Get user's stories
- `GET /api/stories?id=<story-id>` - Get specific story

## Environment Setup

### MongoDB Setup

**Local MongoDB:**

1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/storymaker` as MONGODB_URI

**MongoDB Atlas:**

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace `<username>`, `<password>`, and `<cluster-url>` in the connection string

### OpenAI Setup

1. Sign up for an OpenAI account
2. Generate an API key from the OpenAI dashboard
3. Add the API key to your `.env.local` file

## Deployment

The application can be deployed to platforms like Vercel, Netlify, or any Node.js hosting service.

For Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
