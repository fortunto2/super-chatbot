import { Button } from "@/components/ui/button";
import { GeneratedImage } from "../hooks/use-image-generator";
import NextImage from "next/image";
import { formatTimestamp } from "@/lib/utils/format";
import { X } from "lucide-react";

export  const ImagePreviewModal = ({ image, setSelectedImage, handleImageError }: { image: GeneratedImage, setSelectedImage: (image: GeneratedImage | null) => void, handleImageError: (imageId: string) => void }) => (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl h-full">
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-10 "
          onClick={() => setSelectedImage(null)}
        >
          <X className="size-4" />
        </Button>
        
        <NextImage
          src={image.url}
          alt={image.prompt}
          width={800}
          height={600}
          className="size-full object-contain rounded-lg"
          onError={() => handleImageError(image.id)}
        />
        
        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white p-4 rounded-b-lg">
          <p className="text-sm font-medium line-clamp-2">{image.prompt}</p>
          <p className="text-xs text-gray-300 mt-1">
            {formatTimestamp(image.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );