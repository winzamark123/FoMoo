import React from 'react';
import { trpc } from '@/lib/trpc/client';
import Image from 'next/image';
// import CreatePostForm from './CreatePostForm';
import { getColumnSpan } from './Gallery';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemType = {
  IMAGE: 'image',
};

interface DraggableImageProps {
  image: {
    url: string;
    id: string;
    imageWidth: number | null;
    imageHeight: number | null;
  };
  index: number;
  moveImage: (fromIndex: number, toIndex: number) => void;
}

interface DragItem {
  type: string;
  id: string;
  index: number;
}

const DraggableImage = ({ image, index, moveImage }: DraggableImageProps) => {
  const ref = React.useRef(null);
  const deleteImage = trpc.images.deleteImage.useMutation();

  const handleDeleteImage = async (imageId: string) => {
    console.log('Image ID: ', imageId);
    const res = await deleteImage.mutate({ imageId: imageId });
    console.log(res);
    console.log('Deleted Image');
    // window.location.reload();
  };

  const [, drop] = useDrop({
    accept: ItemType.IMAGE,
    hover(item: DragItem) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.IMAGE,
    item: { type: ItemType.IMAGE, id: image.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative flex ${getColumnSpan(
        image.imageWidth || 0,
        image.imageHeight || 0
      )}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Image
        src={image.url}
        alt=""
        layout="responsive"
        width={image.imageHeight || 0}
        height={image.imageWidth || 0}
        objectFit="cover"
        className="rounded-md"
      />
      <button
        className="absolute right-3 top-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-gray-400 bg-white text-xs text-black hover:bg-red-400"
        onClick={() => handleDeleteImage(image.id)}
      >
        X
      </button>
    </div>
  );
};

export default function EditGallery({ clerkId }: { clerkId: string }) {
  const { data: user_images, isLoading: isLoadingImages } =
    trpc.images.getAllImages.useQuery({ clerkId: clerkId });

  const [images, setImages] = React.useState(user_images || []);

  React.useEffect(() => {
    if (user_images) {
      setImages(user_images);
    }
  }, [user_images]);

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImages(updatedImages);
  };

  if (isLoadingImages) {
    return <div>Loading Images...</div>;
  }

  if (!user_images) {
    return <div>No Images Available for this User</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex flex-col gap-4">
        <div className="grid grid-flow-row-dense grid-cols-12 gap-5">
          {images.map((image, index) => (
            <DraggableImage
              key={image.id}
              image={image}
              index={index}
              moveImage={moveImage}
            />
          ))}
        </div>
      </main>
    </DndProvider>
  );
}
