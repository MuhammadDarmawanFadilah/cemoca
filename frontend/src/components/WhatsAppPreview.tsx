import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Clock } from "lucide-react";

interface WhatsAppPreviewProps {
  title: string;
  message: string;
  image?: string;
  recipientCount: number;
}

export function WhatsAppMessagePreview({ title, message, image, recipientCount }: WhatsAppPreviewProps) {
  const formatMessage = (title: string, message: string) => {
    if (!title && !message) return "Preview pesan akan muncul di sini...";
    
    let formattedMessage = "";
    if (title) {
      formattedMessage += `*${title}*\n\n`;
    }
    if (message) {
      formattedMessage += message;
    }
    
    return formattedMessage;
  };
  const formatMessageForDisplay = (text: string) => {
    // Convert markdown-style formatting to JSX
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Handle bold text (*text*)
      const boldRegex = /\*([^*]+)\*/g;
      const parts = line.split(boldRegex);
      
      return (
        <div key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
          {parts.map((part, partIndex) => {
            // Odd indices are bold text (captured groups)
            if (partIndex % 2 === 1) {
              return <strong key={partIndex} className="font-semibold">{part}</strong>;
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const currentTime = new Date().toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const previewMessage = formatMessage(title, message);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview WhatsApp</h3>
        {recipientCount > 0 && (
          <Badge variant="secondary">
            {recipientCount} penerima
          </Badge>
        )}
      </div>
      
      {/* WhatsApp Chat Mockup */}
      <div className="bg-[#0a0a0a] p-4 rounded-lg">
        {/* WhatsApp Header */}
        <div className="bg-[#075e54] text-white p-3 rounded-t-lg flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-600 text-white text-xs">
              AL
            </AvatarFallback>
          </Avatar>          <div className="flex-1">
            <div className="font-medium text-sm">Sistem Cemoca</div>
            <div className="text-xs text-green-100">online</div>
          </div>
        </div>
        
        {/* WhatsApp Chat Area */}
        <div className="bg-[#0b141a] p-4 min-h-[300px] rounded-b-lg bg-opacity-90 relative overflow-hidden">
          {/* WhatsApp background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-20 gap-2 h-full">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-white rounded-full opacity-10"></div>
              ))}
            </div>
          </div>          {/* Message Bubble */}
          <div className="relative z-10 flex justify-end">
            <div className="max-w-[75%] min-w-[120px] bg-[#005c4b] text-white rounded-lg p-3 shadow-md" 
                 style={{ 
                   wordWrap: 'break-word', 
                   overflowWrap: 'break-word', 
                   wordBreak: 'break-word',
                   hyphens: 'auto'
                 }}>
              {/* Image preview if present */}
              {image && (
                <div className="mb-2">
                  <img 
                    src={image} 
                    alt="Preview" 
                    className="rounded-lg w-full h-auto max-h-40 object-cover"
                  />
                </div>
              )}
              
              {/* Message text */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap" 
                   style={{ 
                     wordWrap: 'break-word', 
                     overflowWrap: 'anywhere',
                     wordBreak: 'break-word'
                   }}>
                {formatMessageForDisplay(previewMessage)}
              </div>
              
              {/* Message footer */}
              <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-300">
                <span>{currentTime}</span>
                <CheckCheck className="h-3 w-3 text-blue-400" />
              </div>
            </div>
          </div>
          
          {/* Fallback message notice if needed */}
          {image && (
            <div className="mt-2 text-xs text-gray-400 text-center">
              <Clock className="h-3 w-3 inline mr-1" />
              Jika paket tidak mendukung gambar, akan dikirim sebagai teks saja
            </div>
          )}
        </div>
      </div>
      
      {/* Message Info */}
      <div className="bg-muted/50 p-3 rounded-lg text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Karakter:</span>
            <span>{previewMessage.length}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span className="font-medium">Tipe:</span>
            <span>{image ? "Teks + Gambar" : "Teks saja"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
