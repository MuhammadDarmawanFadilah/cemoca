import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppMobilePreviewProps {
  title: string;
  message: string;
  image?: string;
  recipientCount: number;
}

export function WhatsAppMobilePreview({ title, message, image, recipientCount }: WhatsAppMobilePreviewProps) {
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
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {      // Convert WhatsApp formatting to HTML
      const formattedLine = line
        // Bold: *text* → <strong>text</strong>
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        // Strikethrough: ~text~ → <s>text</s>
        .replace(/~(.*?)~/g, '<s>$1</s>');
      
      return (
        <div 
          key={lineIndex} 
          className={lineIndex > 0 ? "mt-1" : ""}
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  const currentTime = new Date().toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const previewMessage = formatMessage(title, message);
  // Calculate message width based on content (like real WhatsApp)
  const getMessageWidth = () => {
    const messageLength = previewMessage.length;
    const hasLongWords = previewMessage.split(/\s+/).some(word => word.length > 15);
    
    // More precise width calculation like real WhatsApp
    if (messageLength < 15) return "w-20"; // Very short messages
    if (messageLength < 30) return "w-32"; // Short messages  
    if (messageLength < 60) return "w-48"; // Medium messages
    if (messageLength < 120) return "w-64"; // Long messages
    if (hasLongWords || messageLength > 200) return "w-72"; // Very long or has long words
    return "w-64"; // Default
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          Preview WhatsApp
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Tampilan di HP mobile</span>
          {recipientCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recipientCount} penerima
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">        {/* Phone Frame - Thin border like real phones */}
        <div className="mx-auto bg-gray-900 rounded-[2rem] p-1 shadow-2xl" style={{ width: '320px' }}>
          {/* Phone Screen - More accurate mobile aspect ratio */}
          <div className="bg-white rounded-[1.75rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
            {/* Status Bar */}
            <div className="bg-[#128C7E] text-white px-4 py-2 flex items-center justify-between text-xs">
              <span className="font-medium">9:41</span>
              <div className="flex items-center gap-1">
                {/* Signal bars */}
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-white rounded-full"></div>
                  <div className="w-1 h-2.5 bg-white rounded-full"></div>
                  <div className="w-1 h-3 bg-white rounded-full"></div>
                  <div className="w-1 h-3.5 bg-white rounded-full"></div>
                </div>
                {/* WiFi icon */}
                <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9z"/>
                </svg>
                {/* Battery */}
                <div className="w-6 h-3 border border-white rounded-sm relative">
                  <div className="w-4 h-1.5 bg-white rounded-sm absolute left-0.5 top-0.5"></div>
                </div>
              </div>
            </div>
            
            {/* WhatsApp Header */}
            <div className="bg-[#128C7E] text-white px-3 py-3 flex items-center gap-3">
              {/* Back button */}
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              
              {/* Profile picture */}
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>              {/* Contact info */}
              <div className="flex-1">
                <div className="text-white text-base font-medium">Sistem Cemoca</div>
                <div className="text-green-200 text-xs">online</div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-4">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
            </div>
              {/* Chat Area with exact mobile proportions and WhatsApp styling */}
            <div 
              className="px-2 py-2 relative"
              style={{
                minHeight: '420px', // Increased for better mobile proportions
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.08'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#e5ddd5'
              }}
            >
              {/* Date separator */}
              <div className="flex justify-center mb-3">
                <div className="bg-white/90 px-2 py-1 rounded-lg shadow-sm">
                  <span className="text-xs text-gray-600 font-medium">
                    Hari ini
                  </span>
                </div>
              </div>
                {/* Message bubble - positioned exactly like real WhatsApp */}
              <div className="flex justify-end mb-1 px-1">
                <div className={cn(
                  "relative",
                  getMessageWidth(),
                  "max-w-[85%]" // Real WhatsApp constraint
                )}>                  {/* Message container with exact WhatsApp styling */}
                  <div 
                    className="bg-[#dcf8c6] rounded-lg px-2 py-1.5 relative shadow-sm"
                    style={{
                      borderBottomRightRadius: '3px', // WhatsApp tail style
                      minWidth: '60px'
                    }}
                  >
                    {/* Message tail */}
                    <div 
                      className="absolute -right-1 bottom-0"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid #dcf8c6',
                        borderBottom: '8px solid transparent'
                      }}
                    />
                    
                    {/* Image if present */}
                    {image && (
                      <div className="mb-2 -mx-1">
                        <img 
                          src={image} 
                          alt="Preview" 
                          className="rounded-lg w-full max-h-32 object-cover"
                        />
                      </div>
                    )}
                      {/* Message text with mobile-appropriate wrapping exactly like WhatsApp */}
                    <div 
                      className="text-sm leading-[1.3] text-gray-800 whitespace-pre-wrap"
                      style={{ 
                        fontSize: '14px',
                        lineHeight: '20px', // Exact WhatsApp line height
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        // Exact WhatsApp character wrapping - around 25-30 chars per line on mobile
                        width: 'fit-content',
                        minWidth: '60px'
                      }}
                    >
                      {formatMessageForDisplay(previewMessage)}
                    </div>
                    
                    {/* Message footer - exactly like WhatsApp */}
                    <div className="flex items-end justify-end gap-1 mt-1">
                      <span className="text-xs text-gray-500 leading-none">
                        {currentTime}
                      </span>
                      <CheckCheck className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Input area - mobile style */}
            <div className="bg-[#f0f0f0] px-2 py-1 flex items-center gap-2 border-t border-gray-200">
              <button className="p-1.5 rounded-full">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2a1 1 0 0 0-2 0v2H8V2a1 1 0 0 0-2 0v2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"/>
                </svg>
              </button>
              <div className="flex-1 bg-white rounded-full px-3 py-2 text-sm text-gray-500 border">
                Pesan
              </div>
              <button className="p-1.5 bg-[#075e54] rounded-full">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Message info */}
        <div className="px-4 pb-4">
          <div className="bg-muted/30 rounded-lg p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Karakter:</span>
                <span className="ml-1 font-medium">{previewMessage.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tipe:</span>
                <span className="ml-1 font-medium">{image ? "Teks + Gambar" : "Teks"}</span>
              </div>
            </div>
            {image && (
              <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                <div className="flex items-start gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">
                    Gambar akan dikirim terpisah jika tidak didukung
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
