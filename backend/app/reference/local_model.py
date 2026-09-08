"""Experimental model selects existing excerpts only; it cannot author clinical claims."""
import hashlib
import json
import math
import re
import struct
from pathlib import Path

def sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as file:
        for block in iter(lambda: file.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()

def validate_model_manifest(manifest):
    count = manifest.get('parameter_count')
    if type(count) is not int or not 0 < count <= 2_000_000_000:
        raise ValueError('Model exceeds the strict 2 billion parameter limit or has no verified count')
    if not re.fullmatch('[a-f0-9]{64}', manifest.get('sha256', '')):
        raise ValueError('Missing model SHA-256')

def validate_selection(output, sentences):
    try:
        obj = json.loads(output)
        indices = obj['indices']
        if set(obj) != {'indices'} or not isinstance(indices, list) or not indices or len(indices) > 12:
            raise ValueError()
        if any(type(i) is not int or not 0 <= i < len(sentences) for i in indices):
            raise ValueError()
        return [sentences[i] for i in dict.fromkeys(indices)]
    except (KeyError, TypeError, json.JSONDecodeError, ValueError) as exc:
        raise ValueError('Model did not return supported evidence selections') from exc

def gguf_parameter_count(path):
    """Count the actual stored tensor elements, independent of marketing model names."""
    with open(path, 'rb') as f:
        def read(fmt):
            return struct.unpack('<' + fmt, f.read(struct.calcsize('<' + fmt)))[0]
        def string():
            n = read('Q')
            if n > 100_000_000:
                raise ValueError('Invalid GGUF string')
            return f.read(n)
        def skip(kind):
            sizes = {0:1, 1:1, 2:2, 3:2, 4:4, 5:4, 6:4, 7:1, 10:8, 11:8, 12:8}
            if kind in sizes:
                f.seek(sizes[kind], 1)
            elif kind == 8:
                string()
            elif kind == 9:
                subtype, n = read('I'), read('Q')
                if n > 10_000_000 or subtype == 9:
                    raise ValueError('Invalid GGUF array')
                for _ in range(n):
                    skip(subtype)
            else:
                raise ValueError('Unknown GGUF metadata type')
        if f.read(4) != b'GGUF' or read('I') not in (2, 3):
            raise ValueError('Unsupported GGUF header')
        tensors, metadata = read('Q'), read('Q')
        if tensors > 100_000 or metadata > 100_000:
            raise ValueError('Invalid GGUF counts')
        for _ in range(metadata):
            string()
            skip(read('I'))
        total = 0
        for _ in range(tensors):
            string()
            dimensions = read('I')
            if not 1 <= dimensions <= 8:
                raise ValueError('Invalid tensor shape')
            total += math.prod(read('Q') for _ in range(dimensions))
            read('I')
            read('Q')
        return total
