def fact(a):
    if a:
        return fact(a - 1) * a
    else:
        return 1


# a = "string"
a = 5
print(fact(a))
a = "str"

# if a:
#     a = 1
# else:
#     b = 1

print(a)