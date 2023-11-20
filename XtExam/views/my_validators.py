def valid_name(name):
    if name is not None:
        if 0 < len(name) < 50:
            return True
    return False

def valid_role(role):
    if role is not None:
        if role == 'Student' or role == 'Teacher':
            return True
    return False