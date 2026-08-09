import re

with open("README.md", "r") as f:
    content = f.read()

new_stack = """## Tech Stack

This project is built using modern web technologies:

- **Framework:** [Next.js](https://nextjs.org/) (v16.2.10, App Router)
- **Library:** [React](https://react.dev/) (v19.0.0)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5.7.2)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v3.4.16)
- **Icons:** [Lucide React](https://lucide.dev/) (v0.469.0)
- **AI Integration:** [@google/genai](https://github.com/google/genai-js) (v2.10.0)
- **Charts:** [Recharts](https://recharts.org/) (v2.15.4)
- **Diagrams:** [@xyflow/react](https://reactflow.dev/) (v12.11.1)
- **PDF Export:** [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) (v0.14.0)
- **Database Backend:** [Supabase](https://supabase.com/) (v2.110.1)

## Getting Started"""

updated_content = re.sub(r'## Tech Stack.*## Getting Started', new_stack, content, flags=re.DOTALL)

with open("README.md", "w") as f:
    f.write(updated_content)
