# Testing InfraAI MCP Server with Claude Desktop

This directory contains sample data for testing the multi-tenant prompt discovery and loading system.

## Available Sanmples

### 1. Construction Workflow

- **Prompt**: `prompts/quote_assessment_guide.md`
- **Context**: `context/assessment_criteria.md`
- **Template**: `templates/quote_assessment_form.md`

### 2. Career Workflow

- **Prompt**: `prompts/profile_builder.md`

---

## Sample Prompts for Claude Desktop

Copy and paste these into your Claude Desktop session to test the server:

### Test Case 1: Dynamic Discovery

> "What workflow prompts are available in my InfraAI MCP server? Please list them all with their contents."

### Test Case 2: Subcontractor Quote Assessment

> "I need to evaluate a subcontractor quote for electrical works. Please load the `quote_assessment_guide.md` and use the project's `assessment_criteria.md` to analyze the following quote:
>
> 'ABC Electrical: $55,000 for full scope. Excludes waste removal. Completion in 4 weeks.'"

### Test Case 3: Profile Building

> "Use the `profile_builder.md` guide to help me write a professional summary. I am a Project Manager with 10 years of experience in high-rise construction, specializing in safety compliance."

### Test Case 4: Loading Specific Files

> "Load the template `quote_assessment_form.md` and show me the structure."

---

## Setup Instructions

1.  Ensure your `infraconsulting` tenant folder is correctly mapped in your MCP server.
2.  Refresh your Claude Desktop session.
3.  Choose one of the prompts above and see the InfraAI magic happen!
