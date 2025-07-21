import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GeneratedImage } from "../hooks/use-image-generator";
import { Clock, Download, Copy, Trash2, Settings, ZoomIn } from "lucide-react";
import NextImage from "next/image";
import { formatTimestamp } from "@/lib/utils/format";

type ImageCardProps = {     
    image: GeneratedImage;
    isCurrent?: boolean;
    onCopyImageUrl: (image: GeneratedImage) => void;
    onDownloadImage: (image: GeneratedImage) => void;
    onDeleteImage: (imageId: string) => void;
    setSelectedImage: (image: GeneratedImage | null) => void;
    handleImageError: (imageId: string) => void;
    imageErrors: Set<string>;
}

export const ImageCard = ({ 
    image, 
    isCurrent = false, 
    onCopyImageUrl, 
    onDownloadImage, 
    onDeleteImage, 
    setSelectedImage, 
    handleImageError, 
    imageErrors 
}: ImageCardProps) => {
    const hasError = imageErrors.has(image.id);
    const actions = [
      {
        icon: <ZoomIn className="size-4" />,
        onClick: () => setSelectedImage(image)
      },
      {
        icon: <Copy className="size-4" />,
        onClick: () => onCopyImageUrl(image)
      },
      {
        icon: <Download className="size-4" />,
        onClick: () => onDownloadImage(image)
      },
      {
        icon: <Trash2 className="size-4" />,
        onClick: () => onDeleteImage(image.id)
      }
    ]

    return (
      <Card className={`group relative overflow-hidden ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="aspect-square relative">
          {hasError ? (
            <div className="size-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="bg-red-100 rounded-full p-3 size-14 mx-auto mb-2 flex items-center justify-center">
                  <Settings className="size-6 text-red-400" />
                </div>
                <p className="text-sm font-medium">Failed to load</p>
              </div>
            </div>
          ) : (
            <NextImage
              src={image.url}
              alt={image.prompt}
              width={300}
              height={300}
              className="size-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
              onClick={() => setSelectedImage(image)}
              onError={() => handleImageError(image.id)}
            />
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-wrap gap-1">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="secondary"
                className="bg-gray-800/90 hover:bg-gray-700 text-white border-gray-600 shadow-lg"
                onClick={action.onClick}
              >
                {action.icon}
              </Button>
            ))}
             
            </div>
          </div>
          
          {isCurrent && (
            <div className="absolute top-2 left-2">
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Latest
              </span>
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-2">
            {image.prompt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="size-3 mr-1" />
              {formatTimestamp(image.timestamp)}
            </div>
            
            <div className="flex items-center">
              <Settings className="size-3 mr-1" />
              {image.settings.model}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };