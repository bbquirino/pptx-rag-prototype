# Technical Interview - Sample RAG Project

## Project Context

[AlbertaPerspectives.ca](http://AlbertaPerspectives.ca) is an insight community that collects economic data from business owners across Alberta. This technical challenge involves building a prototype for their on-demand economic research chatbot system.

The system will allow businesses to query existing research through an AI-powered chat interface, making valuable economic insights more accessible to the Alberta business community.

## Challenge Description (180 minutes)

You will build a RAG system prototype that demonstrates the core functionality of the full project. Your implementation should showcase how you would approach:

1. Processing PowerPoint reports from Alberta Perspectives (sample files provided)
2. Extracting and vectorizing content for efficient retrieval
3. Storing data and embeddings in Supabase
4. Implementing semantic search and context retrieval
5. Integrating with an LLM for answer generation
6. Creating a clean, user-friendly chat interface

## Technical Requirements

### Database & Schema (Supabase)

- Design a database architecture, for the vector and/or non-vector database as required

### Document Processing

- Extract text from PowerPoint files
- Generate vector embeddings
- Store in Supabase
- (Optional) Handle images and graphs if time permits

### RAG Pipeline

- Implement similarity search for context retrieval
- Integrate with your choice of LLM (e.g., OpenAI)
- Generate context-aware responses
- (Optional) Implement confidence scoring

### Frontend Interface

- Build a minimal chat interface
- Support for:
  - User query input
  - Response display
  - (Optional) Conversation history

## What We're Looking For

### Technical Implementation (55%)

- Successful document processing and text extraction
- Effective vector operations and embeddings
- Working RAG pipeline with relevant context retrieval
- Functional chat interface with good UX

### System Architecture (15%)

- Well-designed database schema
- Robust error handling
- Scalable system design

### Code Quality (15%)

- Clean, well-organized code
- Clear documentation
- Proper error handling
- Appropriate use of data structures

### Problem Solving & Communication (15%)

- Clear technical communication
- Effective time management
- Sound decision-making

## Getting Started

1. Review the sample PowerPoint files in `data_samples/`
2. Set up your Supabase project using `.env.template`
3. Implement the core RAG pipeline
4. Create the chat interface
5. Document your approach in `approach.md`
6. Deploy the project on Vercel and respond with a vercel link.

## Repository Contents

- `data_samples/`: Sample PowerPoint files with economic data
- `evaluation_criteria.md`: Detailed evaluation criteria
- `approach.md`: Document your technical approach here
- `.env.template`: Template for required environment variables

## Expected Deliverables

1. Vercel link for the working prototype demonstrating:
   - PowerPoint processing pipeline
   - Supabase integration with vector storage
   - RAG-powered chat interface
2. Code pushed back to Github, with documentation including:
   - System architecture overview
   - Database schema design
   - Setup instructions
   - Discussion of trade-offs and potential improvements

## Rules and Guidelines

- You may use anything that helps you complete the task
- Feel free to use AI tools to assist your development
- You can ask clarifying questions at any time
- Focus on core functionality first
- Document any assumptions you make
- Time management is crucial - prioritize MVP features
- Do your best. If you don't finish, push the progress that you've made and explain how you would go about completing the project.

Good luck with the challenge! We're excited to see your solution.
