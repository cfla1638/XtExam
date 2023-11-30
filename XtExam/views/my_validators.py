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

def valid_exam_title(exam_title):
    if exam_title is not None:
        if 0 < len(exam_title) < 100:
            return True
    return False

def valid_bulletin_content(bulletin_content):
    if bulletin_content is not None:
        if 0 < len(bulletin_content) < 250:
            return True
    return False