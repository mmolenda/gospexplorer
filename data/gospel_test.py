import json
import sys

file_to_test = sys.argv[1]

with open('gospel_test.json') as fh:
    test = json.load(fh)

with open(file_to_test) as fh:
    gosp = json.load(fh)

for ii, (book_id, paragraphs) in enumerate(gosp.iteritems()):
    for jj, paragraph in enumerate(paragraphs):
        if test[book_id][jj] != len(paragraph):
            print "{}{} -- {} < {}".format(book_id, jj + 1, test[book_id][jj], len(paragraph))