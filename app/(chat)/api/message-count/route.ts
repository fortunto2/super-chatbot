import { auth } from '@/app/(auth)/auth';
import { getMessageCountByUserId } from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = session.user.type;
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    const maxMessages = entitlementsByUserType[userType].maxMessagesPerDay;
    const remainingMessages = Math.max(0, maxMessages - messageCount);
    const usedPercentage = Math.round((messageCount / maxMessages) * 100);

    return Response.json({
      messageCount,
      maxMessages,
      remainingMessages,
      usedPercentage,
      userType,
    });
  } catch (error) {
    console.error('Error fetching message count:', error);
    return Response.json(
      { error: 'Failed to fetch message count' },
      { status: 500 },
    );
  }
}
