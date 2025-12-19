import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific data by key
      const data = await prisma.workflowData.findFirst({
        where: {
          userId,
          storageKey: key,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          storageKey: true,
          data: true,
          description: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!data) {
        return Response.json({ error: 'Data not found or expired' }, { status: 404 });
      }

      return Response.json({
        success: true,
        data: {
          key: data.storageKey,
          value: data.data,
          description: data.description,
          expiresAt: data.expiresAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
    } else {
      // List all data for user
      const dataList = await prisma.workflowData.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          storageKey: true,
          description: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return Response.json({
        success: true,
        data: dataList.map(item => ({
          key: item.storageKey,
          description: item.description,
          expiresAt: item.expiresAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      });
    }
  } catch (error: any) {
    console.error('Data API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return Response.json({ error: 'Key parameter is required' }, { status: 400 });
    }

    // Delete specific data
    const deleted = await prisma.workflowData.deleteMany({
      where: {
        userId,
        storageKey: key,
      },
    });

    if (deleted.count === 0) {
      return Response.json({ error: 'Data not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Data with key '${key}' deleted successfully`,
    });
  } catch (error: any) {
    console.error('Data deletion error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
