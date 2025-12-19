import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workflowIdQuery = searchParams.get('workflowId');
    // Ensure workflowId is either a non-empty string or null.
    const workflowId = (workflowIdQuery && workflowIdQuery.trim() !== "") ? workflowIdQuery.trim() : null;

    if (workflowId) {
      // Attempt to delete a workflow-specific chat session
      // This assumes that if a workflowId is provided, it's a valid string for the composite key.
      // Prisma's delete operation on a unique constraint will fail if the record doesn't exist,
      // so we can directly attempt deletion. If it fails because the record isn't found,
      // it's effectively the same as "history cleared" for that specific context.
      try {
        await prisma.chatSession.delete({
          where: {
            userId_workflowId: {
              userId: userId,
              workflowId: workflowId, // workflowId is a string here
            }
          },
        });
      } catch (error: any) {
        // Handle cases where the specific session doesn't exist (e.g., Prisma's P2025 error)
        // For other errors, let them propagate to the main catch block.
        if (error.code !== 'P2025') { // P2025: Record to delete not found
          throw error;
        }
        // If P2025, it means no such record, so history is "clear" for this context.
      }
    } else {
      // Delete general chat session (workflowId is null)
      // For nullable parts of a composite key, findFirst + delete by id is more reliable
      const generalSession = await prisma.chatSession.findFirst({
        where: {
          userId: userId,
          workflowId: null,
        },
      });
      if (generalSession) {
        await prisma.chatSession.delete({
          where: {
            id: generalSession.id,
          },
        });
      }
    }
    // If no session exists, it's effectively "deleted" or clear, so we can return success.
    
    return NextResponse.json({ message: 'Chat history deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new NextResponse(JSON.stringify({ message: 'Failed to delete chat history.', error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
