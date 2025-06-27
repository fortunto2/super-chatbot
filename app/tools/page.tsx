import Link from 'next/link';
import { ArrowLeft, ImageIcon, VideoIcon, Sparkles, Zap, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Back to Chat
              </Button>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Home</span>
              <span>/</span>
              <span className="font-medium">AI Tools</span>
            </div>
          </div>

          <Separator />

          {/* Main content */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Tools
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI-powered tools for generating high-quality images and videos. 
              Choose the tool that fits your creative needs.
            </p>
          </div>

          {/* Tools grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {/* Image Generator Card */}
            <Link href="/tools/image-generator">
              <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <ImageIcon className="size-8 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">AI Image Generator</CardTitle>
                  <CardDescription className="text-base">
                    Create stunning images using advanced AI models like FLUX Pro/Dev, Google Imagen, and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="size-4" />
                        <span>High Quality</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="size-4" />
                        <span>Fast Generation</span>
                      </div>
                    </div>
                    <Button className="w-full group-hover:bg-blue-600" size="lg">
                      <ImageIcon className="size-4 mr-2" />
                      Generate Images
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Video Generator Card */}
            <Link href="/tools/video-generator">
              <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors">
                      <VideoIcon className="size-8 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">AI Video Generator</CardTitle>
                  <CardDescription className="text-base">
                    Generate high-quality videos using AI models like VEO3, KLING, LTX, and more from SuperDuperAI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Play className="size-4" />
                        <span>Professional Quality</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="size-4" />
                        <span>Real-time Progress</span>
                      </div>
                    </div>
                    <Button className="w-full group-hover:bg-purple-600" size="lg">
                      <VideoIcon className="size-4 mr-2" />
                      Generate Videos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Footer info */}
          <div className="text-center text-sm text-muted-foreground border-t pt-8 mt-12">
            <p>
              Powered by <strong>SuperDuperAI</strong> • 
              State-of-the-art AI models for creative content generation • 
              Fast, reliable, and high-quality results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 