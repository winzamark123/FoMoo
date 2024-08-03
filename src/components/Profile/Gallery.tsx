import React from 'react';
import { trpc } from '@/lib/trpc/client';
import Image from 'next/image';

export default function Gallery({ clerkId }: { clerkId: string }) {
  const { data: user_images, isLoading: isLoadingImages } =
    trpc.images.getAllImages.useQuery({ clerkId: clerkId });

  if (isLoadingImages) {
    return <div>Loading Images...</div>;
  }

  if (!user_images) {
    return <div>No Images Available for this User</div>;
  }

  const getColumnSpan = (width: number, height: number) => {
    const aspectRatio = width / height;
    if (aspectRatio > 1.5) return 'col-span-8'; // Wide images
    if (aspectRatio > 1) return 'col-span-6'; // Landscape images
    if (aspectRatio > 0.75) return 'col-span-4'; // Square-ish images
    return 'col-span-4'; // Portrait images
  };

  return (
    <main className="flex flex-col gap-4">
      <h2 className="mb-10 mt-10 font-mono text-xl font-bold">Projects</h2>
      <div className="grid grid-flow-row-dense grid-cols-12 gap-5">
        {user_images.map((image) => {
          const columnSpan = getColumnSpan(
            image.imageWidth || 0,
            image.imageHeight || 0
          );
          return (
            <div key={image.id} className={`flex ${columnSpan}`}>
              <Image
                src={image.url}
                alt=""
                layout="responsive"
                width={image.imageHeight || 0}
                height={image.imageWidth || 0}
                objectFit="cover"
                className="rounded-md transition-opacity duration-300 hover:cursor-pointer hover:opacity-75"
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
