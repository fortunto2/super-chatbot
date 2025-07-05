import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TOOLS_CONFIG } from '@/lib/config/tools-config';
import { ToolIcon } from '@/lib/config/tools-icons';

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main content */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Tools
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI-powered tools for generating high-quality images, videos, and enhancing your prompts. 
              Choose the tool that fits your creative needs.
            </p>
          </div>

          {/* Tools grid - Dynamic from TOOLS_CONFIG */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {TOOLS_CONFIG.map((tool) => (
              <Link key={tool.id} href={tool.href}>
                <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`p-4 rounded-full bg-${tool.bgColor} group-hover:bg-${tool.hoverBgColor} transition-colors`}>
                        <ToolIcon name={tool.iconName} className={`size-8 text-${tool.primaryColor}`} />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{tool.name}</CardTitle>
                    <CardDescription className="text-base">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                        {tool.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <ToolIcon name={feature.iconName} />
                            <span>{feature.label}</span>
                          </div>
                        ))}
                      </div>
                      <Button className={`w-full group-hover:bg-${tool.hoverColor}`} size="lg">
                        <ToolIcon name={tool.iconName} className="size-4 mr-2" />
                        {tool.id === 'image-generator' ? 'Generate Images' : 
                         tool.id === 'video-generator' ? 'Generate Videos' : 
                         'Enhance Prompts'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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