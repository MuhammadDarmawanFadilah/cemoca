import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Clock, Eye, Wifi, Signal, Battery } from "lucide-react";

interface WhatsAppPreviewEnhancedProps {
  title: string;
  message: string;
  image?: string;
  recipientCount: number;
}

export function WhatsAppMessagePreviewEnhanced({ title, message, image, recipientCount }: WhatsAppPreviewEnhancedProps) {
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          Preview WhatsApp
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Tampilan di perangkat mobile</span>
          {recipientCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recipientCount} penerima
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Phone Frame */}
        <div className="mx-4 mb-4 bg-black rounded-[2rem] p-1 shadow-2xl">
          {/* Phone Screen */}
          <div className="bg-white rounded-[1.7rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-[#075e54] text-white px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="font-medium">9:41</span>
              </div>
              <div className="flex items-center gap-1">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <Battery className="h-3 w-3" />
                <span className="text-xs">100%</span>
              </div>
            </div>
            
            {/* WhatsApp Header */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-9 w-9 border-2 border-white/20">
                  <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                    AL
                  </AvatarFallback>
                </Avatar>                <div>
                  <div className="font-medium text-sm">Sistem Cemoca</div>
                  <div className="text-xs text-emerald-100 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                    online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Chat Background */}
            <div 
              className="min-h-[400px] px-4 py-3 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#e5ddd5'
              }}
            >
              {/* WhatsApp typical chat pattern overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
                }}></div>
              </div>
              
              {/* Date Header */}
              <div className="flex justify-center mb-4">
                <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
                  <span className="text-xs text-gray-600 font-medium">
                    {new Date().toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              
              {/* Message Bubble */}
              <div className="flex justify-end relative z-10">
                <div className="max-w-[85%] relative">
                  {/* Message Bubble */}
                  <div 
                    className="bg-[#dcf8c6] rounded-lg shadow-sm relative"
                    style={{
                      borderBottomRightRadius: '4px'
                    }}
                  >
                    {/* Message bubble tail */}
                    <div 
                      className="absolute -right-2 bottom-0 w-0 h-0"
                      style={{
                        borderLeft: '8px solid #dcf8c6',
                        borderBottom: '8px solid transparent'
                      }}
                    ></div>
                    
                    <div className="p-3">
                      {/* Image preview if present */}
                      {image && (
                        <div className="mb-3 -m-1">
                          <img 
                            src={image} 
                            alt="Preview" 
                            className="rounded-lg w-full h-auto max-h-48 object-cover shadow-sm"
                          />
                        </div>
                      )}
                      
                      {/* Message text */}
                      <div 
                        className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800"
                        style={{ 
                          wordWrap: 'break-word', 
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word'
                        }}
                      >
                        {formatMessageForDisplay(previewMessage)}
                      </div>
                      
                      {/* Message footer */}
                      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-500">
                        <span className="font-medium">{currentTime}</span>
                        <CheckCheck className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Typing indicator (subtle animation) */}
              <div className="mt-6 flex justify-start">
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-xs text-gray-500">Member sedang mengetik...</span>
                </div>
              </div>
            </div>
            
            {/* Input Area */}
            <div className="bg-[#f0f0f0] p-3 flex items-center gap-2 border-t border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2a1 1 0 0 0-2 0v2H8V2a1 1 0 0 0-2 0v2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM5 6h14a1 1 0 0 1 1 1v2H4V7a1 1 0 0 1 1-1zm14 14H5a1 1 0 0 1-1-1v-8h16v8a1 1 0 0 1-1 1z"/>
                </svg>
              </div>
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-500">
                Ketik pesan
              </div>
              <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message Statistics */}
        <div className="px-4 pb-4">
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm">Informasi Pesan</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Karakter:</span>
                <span className="font-medium">{previewMessage.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe:</span>
                <span className="font-medium">{image ? "Teks + Gambar" : "Teks"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penerima:</span>
                <span className="font-medium">{recipientCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-emerald-600">Siap Kirim</span>
              </div>
            </div>
            
            {/* Delivery notice */}
            {image && (
              <div className="mt-3 pt-2 border-t border-muted-foreground/20">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Jika paket data penerima tidak mendukung gambar, pesan akan dikirim sebagai teks saja
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
