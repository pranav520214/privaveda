"""PRIVAVEDA Hardware Detection & Runtime Capability Profiler.

Architectural Rule:
"Detect system capability without transmitting any data externally.
Suggest local runtime mode: MINIMAL, STANDARD, or HIGH_FIDELITY."
"""
import os
import platform
import shutil
from dataclasses import dataclass
from typing import Any


@dataclass
class HardwareCapabilityReport:
    os_name: str
    os_release: str
    architecture: str
    cpu_count: int
    ram_total_gb: float
    disk_free_gb: float
    gpu_available: bool
    gpu_device_name: str | None
    gpu_vram_gb: float | None
    suggested_mode: str  # "MINIMAL", "STANDARD", "HIGH_FIDELITY"
    configured_medical_model: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "os": f"{self.os_name} {self.os_release} ({self.architecture})",
            "cpu_cores": self.cpu_count,
            "ram_total_gb": round(self.ram_total_gb, 1),
            "disk_free_gb": round(self.disk_free_gb, 1),
            "gpu": {
                "available": self.gpu_available,
                "device": self.gpu_device_name,
                "vram_gb": round(self.gpu_vram_gb, 1) if self.gpu_vram_gb else None
            },
            "suggested_mode": self.suggested_mode,
            "configured_medical_model": self.configured_medical_model
        }


def detect_system_capabilities() -> HardwareCapabilityReport:
    """Inspects local CPU, RAM, disk, and GPU resources safely and offline."""
    cpu_count = os.cpu_count() or 4
    
    # RAM estimation
    ram_gb = 8.0
    try:
        import ctypes
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("sullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]
        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
            ram_gb = stat.ullTotalPhys / (1024 ** 3)
    except Exception:
        pass

    # Disk free space
    disk_free = 50.0
    try:
        total, used, free = shutil.disk_usage(".")
        disk_free = free / (1024 ** 3)
    except Exception:
        pass

    # GPU Detection (via torch or subprocess query without network)
    gpu_avail = False
    gpu_name = None
    vram_gb = None
    try:
        import torch
        if torch.cuda.is_available():
            gpu_avail = True
            gpu_name = torch.cuda.get_device_name(0)
            vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    except Exception:
        pass

    # Suggest mode
    if gpu_avail and (vram_gb or 0) >= 8.0 and ram_gb >= 16.0:
        mode = "HIGH_FIDELITY"
    elif ram_gb >= 8.0:
        mode = "STANDARD"
    else:
        mode = "MINIMAL"

    configured_model = os.environ.get("MEDICAL_MODEL_PROVIDER", "null (deterministic fallback)")

    return HardwareCapabilityReport(
        os_name=platform.system(),
        os_release=platform.release(),
        architecture=platform.machine(),
        cpu_count=cpu_count,
        ram_total_gb=ram_gb,
        disk_free_gb=disk_free,
        gpu_available=gpu_avail,
        gpu_device_name=gpu_name,
        gpu_vram_gb=vram_gb,
        suggested_mode=mode,
        configured_medical_model=configured_model
    )
