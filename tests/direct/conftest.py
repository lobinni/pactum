from gltest.direct import create_address


def hx(value):
    if hasattr(value, "as_hex"):
        return value.as_hex
    return "0x" + value.hex()
