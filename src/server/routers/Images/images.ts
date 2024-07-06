import { router, publicProcedure, protectedProcedure } from '@/lib/trpc/trpc';
import { z } from 'zod';
import prisma from '@prisma/prisma';
import { getPresignedURL } from './s3-post';
import { deletePhotoCommand } from './s3-delete';

export const images_router = router({
  getAllImages: publicProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ input }) => {
      const images = await prisma.images.findMany({
        where: {
          clerkId: input.clerkId,
          // not associated with a profile (hence not a profile pic)
          Profile: {
            none: {},
          },
        },
      });

      const imageDetails = images.map((image) => ({
        url: image.url,
        id: image.id,
      }));
      return imageDetails;
    }),

  updateProfilePic: protectedProcedure
    .input(
      z.object({
        file_type: z.string(),
        size: z.number(),
        checksum: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success, error } = await getPresignedURL({
        file_type: input.file_type,
        size: input.size,
        checksum: input.checksum,
        clerkId: ctx.user.id,
      });

      if (error) {
        throw new Error(error);
      }

      // const image = await prisma.images.findUnique({
      //   where: { id: success?.image_id as string },
      // });

      // const { success: del_success, error: del_error } =
      //   await deletePhotoCommand({
      //     key: image?.key as string,
      //   });

      // if (del_error) {
      //   throw new Error(del_error);
      // } else if (del_success) {
      //   console.log('Deleted old profile pic');
      // }

      await prisma.profile.update({
        where: { clerkId: ctx.user.id },
        data: { profilePicId: success?.image_id },
      });

      return { success, error };
    }),

  uploadImage: protectedProcedure
    .input(
      z.object({
        file_type: z.string(),
        size: z.number(),
        checksum: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success, error } = await getPresignedURL({
        file_type: input.file_type,
        size: input.size,
        checksum: input.checksum,
        clerkId: ctx.user.id,
      });

      if (error) {
        throw new Error(error);
      }

      return { success, error };
    }),

  deleteImage: protectedProcedure
    .input(z.object({ imageId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const image = await prisma.images.findUnique({
        where: { id: input.imageId },
      });

      if (image?.clerkId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      const { success, error } = await deletePhotoCommand({
        key: image?.key as string,
      });
      if (error) {
        throw new Error(error);
      }
      return { success, error };
    }),
});

export type ImageRouter = typeof images_router;
