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

def valid_class_name(class_name):
    if class_name is not None:
        if 0 < len(class_name) < 50:
            return True
    return False