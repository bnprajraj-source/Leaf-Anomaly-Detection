"""
Attention Mechanism Module
==========================
Implements Convolutional Block Attention Module (CBAM) with:
  - Channel Attention: highlights informative feature channels
  - Spatial Attention: highlights informative spatial locations
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ChannelAttention(nn.Module):
    """
    Channel Attention Module.
    Recalibrates channel-wise feature responses by modelling
    inter-channel dependencies.
    """

    def __init__(self, in_channels: int, reduction_ratio: int = 16):
        super().__init__()
        mid = max(1, in_channels // reduction_ratio)
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.shared_mlp = nn.Sequential(
            nn.Linear(in_channels, mid, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(mid, in_channels, bias=False),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.shape
        avg = self.shared_mlp(self.avg_pool(x).view(b, c))
        mx  = self.shared_mlp(self.max_pool(x).view(b, c))
        scale = torch.sigmoid(avg + mx).view(b, c, 1, 1)
        return x * scale


class SpatialAttention(nn.Module):
    """
    Spatial Attention Module.
    Generates a spatial attention map from concatenated
    channel-wise average and max-pooled features.
    """

    def __init__(self, kernel_size: int = 7):
        super().__init__()
        assert kernel_size in (3, 7), "kernel_size must be 3 or 7"
        pad = (kernel_size - 1) // 2
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=pad, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg = x.mean(dim=1, keepdim=True)
        mx, _ = x.max(dim=1, keepdim=True)
        pooled = torch.cat([avg, mx], dim=1)
        scale = torch.sigmoid(self.conv(pooled))
        return x * scale


class CBAM(nn.Module):
    """
    Convolutional Block Attention Module.
    Applies channel attention then spatial attention sequentially.
    """

    def __init__(self, in_channels: int, reduction_ratio: int = 16, spatial_kernel: int = 7):
        super().__init__()
        self.channel_attention = ChannelAttention(in_channels, reduction_ratio)
        self.spatial_attention = SpatialAttention(spatial_kernel)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.channel_attention(x)
        x = self.spatial_attention(x)
        return x

    def get_attention_maps(self, x: torch.Tensor):
        """Return intermediate attention maps for visualization."""
        x_ch  = self.channel_attention(x)
        x_sp  = self.spatial_attention(x_ch)

        avg = x_ch.mean(dim=1, keepdim=True)
        mx, _ = x_ch.max(dim=1, keepdim=True)
        pooled = torch.cat([avg, mx], dim=1)
        spatial_map = torch.sigmoid(self.spatial_attention.conv(pooled))
        return x_sp, spatial_map.squeeze(1)
