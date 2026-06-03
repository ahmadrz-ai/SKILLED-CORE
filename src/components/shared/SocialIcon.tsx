import React from 'react';
import { 
  Mail, Phone, Linkedin, Github, Twitter, Instagram, 
  Facebook, Youtube, Music2, Globe 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialIconProps {
  platform: string;
  className?: string;
}

export function SocialIcon({ platform, className }: SocialIconProps) {
  const platLower = platform.toLowerCase();
  
  let IconComponent = Globe;
  if (platLower.includes('email') || platLower.includes('mail')) {
    IconComponent = Mail;
  } else if (platLower.includes('phone') || platLower.includes('tel')) {
    IconComponent = Phone;
  } else if (platLower.includes('linkedin')) {
    IconComponent = Linkedin;
  } else if (platLower.includes('github')) {
    IconComponent = Github;
  } else if (platLower.includes('twitter') || platLower.includes('x')) {
    IconComponent = Twitter;
  } else if (platLower.includes('instagram')) {
    IconComponent = Instagram;
  } else if (platLower.includes('facebook')) {
    IconComponent = Facebook;
  } else if (platLower.includes('youtube')) {
    IconComponent = Youtube;
  } else if (platLower.includes('tiktok')) {
    IconComponent = Music2;
  } else if (platLower.includes('whatsapp')) {
    IconComponent = Phone;
  }

  return (
    <div className={cn(
      "w-8 h-8 rounded-lg bg-sc-purple-100 flex items-center justify-center border border-sc-purple-200/50 shadow-sc-xs shrink-0 transition-colors",
      className
    )}>
      <IconComponent className="w-4 h-4 text-sc-purple-600" />
    </div>
  );
}
