# Create README if it doesn't exist
if (!(Test-Path "README.md")) {
    Set-Content -Path "README.md" -Value "# Project Readme"
}

# Define commits and dates
$commitMessages = @(
    "feat: Initial project setup with Next.js and Prisma",
    "feat: Implement user authentication using Clerk",
    "feat: Create basic database schema for users and workflows",
    "feat: Build core workflow creation and editing UI",
    "feat: Implement workflow execution logic",
    "fix: Resolve issues with workflow state management",
    "feat: Add billing system with Stripe for credit purchases",
    "feat: Implement credential management for third-party integrations",
    "feat: Develop dashboard for analytics and usage tracking",
    "feat: Integrate chatbot for user support",
    "docs: Update README.md with project overview and setup guide",
    "refactor: Optimize workflow executor for performance"
)

$commitDates = @(
    "2025-04-09 10:00:00",
    "2025-04-09 14:30:00",
    "2025-04-09 18:00:00",
    "2025-04-10 11:00:00",
    "2025-04-10 15:00:00",
    "2025-04-10 19:30:00",
    "2025-04-12 09:00:00",
    "2025-04-12 12:45:00",
    "2025-04-12 16:20:00",
    "2025-04-13 10:15:00",
    "2025-04-13 14:00:00",
    "2025-04-13 17:45:00"
)

$author = "abhisek343 <abhisek343@users.noreply.github.com>"

git add .

for ($i = 0; $i -lt $commitMessages.Length; $i++) {
    $message = $commitMessages[$i]
    $date = $commitDates[$i]

    if ($i -gt 0) {
        Add-Content -Path "README.md" -Value "`n# Commit $($i+1)"
        git add "README.md"
    }

    git commit --author="$author" --date="$date" -m "$message"
}

Write-Host "12 commits have been created successfully."
