import prisma from '@prisma/prisma';

interface createUserProp {
  clerkId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

interface createProfileProp {
  userId: string;
  userFirstName: string;
  userLastName: string;
}

interface createContactProp {
  userId: string;
  userEmail: string;
}

export async function createUser({
  clerkId,
  userFirstName,
  userLastName,
  userEmail,
}: createUserProp) {
  try {
    // Check if user already exists, might not need this in production
    // since its only called when user is created
    // but it's good to have it here for testing since we have many moving parts

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    });

    if (existingUser) {
      console.log('User already exists');
      return;
    }

    const newUser = await prisma.user.create({
      data: { clerkId },
    });

    await createProfile({
      userId: newUser.id,
      userFirstName,
      userLastName,
    });
    await createContact({ userId: newUser.id, userEmail: userEmail });
  } catch (err) {
    console.error('ERROR CREATING USER' + err);
    throw new Error('ERROR CREATING USER');
  }
}

async function createProfile({
  userId,
  userFirstName,
  userLastName,
}: createProfileProp) {
  try {
    await prisma.profile.create({
      data: {
        userId,
        firstName: userFirstName,
        lastName: userLastName,
      },
    });
  } catch (err) {
    console.error('ERROR CREATING PROFILE' + err);
    throw new Error('ERROR CREATING PROFILE');
  }
}

async function createContact({ userId, userEmail }: createContactProp) {
  try {
    await prisma.contact.create({
      data: {
        userId,
        email: userEmail,
      },
    });
  } catch (err) {
    console.error('ERROR CREATING CONTACT' + err);
    throw new Error('ERROR CREATING CONTACT');
  }
}
