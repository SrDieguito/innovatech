import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-social-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./component.html",
  styleUrls: ["./component.css"]
})
export class SocialProfileComponent implements OnInit {
  activeTab = "timeline";
  newPost = "";

  userProfile = {
    fullName: "Sarah Johnson",
    location: "San Francisco, CA",
    bio: "Digital Artist & UI Designer | Creating visual stories",
    work: "Senior Designer at Creative Studios",
    education: "Bachelor of Fine Arts, Design Institute",
    coverPhoto: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
  };

  posts = [
    {
      authorName: "Sarah Johnson",
      authorPic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      content: "Just finished my latest digital art piece! What do you think?",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
      timestamp: new Date()
    },
    {
      authorName: "Sarah Johnson",
      authorPic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      content: "Beautiful day for outdoor sketching!",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1))
    }
  ];

  friendsList = [
    { name: "John Doe", picture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e" },
    { name: "Emma Wilson", picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb" },
    { name: "Mike Chen", picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" },
    { name: "Lisa Taylor", picture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80" },
    { name: "David Kim", picture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e" },
    { name: "Anna Brown", picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb" }
  ];

  recentPhotos = [
    { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", description: "Art piece 1" },
    { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", description: "Art piece 2" },
    { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", description: "Art piece 3" },
    { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", description: "Art piece 4" },
    { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", description: "Art piece 5" },
    { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f", description: "Art piece 6" }
  ];

  constructor() {}

  ngOnInit(): void {}

  switchTab(tab: string): void {
    this.activeTab = tab;
  }
}
