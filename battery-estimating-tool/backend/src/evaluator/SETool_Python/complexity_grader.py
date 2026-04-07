"""
Python Model Complexity Grader

Returns 0, 1, or 2 in ascending complexity

Grading is done on 3 primary heuristics:

Imports: If you import torch, it flags 2. By default we presume you are using deep learning.

Loop depth: It checks how nested your loops are. One loop stays low; nested loops bump the score.

Keywords: It scans for expensive calls like .inv() or .fit(), which suggest heavier matrix computations.
"""

import ast

# by default, we just grade using the current folder
def grade_complexity(file_path):
    try:
        with open(file_path, "r") as f:
            tree = ast.parse(f.read())
    except FileNotFoundError:
        print("Error: Model.py not found by complexity grader, this is extremely unexpected, did you delete the file midway between evaluations?", file=sys.stderr)
        return 0

    score = 0
    found_heavy_ops = False
    max_loop_depth = 0

    class ComplexityVisitor(ast.NodeVisitor):
        nonlocal score, found_heavy_ops, max_loop_depth

        def visit_Import(self, node):
            for alias in node.names:
                # High complexity indicators
                if alias.name in ['torch', 'tensorflow', 'keras', 'jax']:
                    score = 2 
                # Moderate complexity indicators
                if alias.name in ['scipy', 'sklearn', 'dask', 'coiled']:
                    score = max(score, 1)
            self.generic_visit(node)

        def visit_ImportFrom(self, node):
            # pytorch, tensorflow, and keras are the ones we use
            if node.module in ['torch', 'tensorflow', 'keras']:
                score = 2
            if node.module in ['scipy', 'sklearn', 'numpy.linalg']:
                score = max(score, 1)
            self.generic_visit(node)

        def visit_Call(self, node):
            # Check for expensive operations like matrix inversion
            if isinstance(node.func, ast.Attribute):
                # operations recommended by AI assistant, I don't know enough about the typical functions used in industry
                if node.func.attr in ['inv', 'solve', 'eigh', 'predict', 'fit']:
                    found_heavy_ops = True
            self.generic_visit(node)

        def visit_For(self, node):
            self.check_loop_depth(node, 1)
            self.generic_visit(node)

        def visit_While(self, node):
            self.check_loop_depth(node, 1)
            self.generic_visit(node)

        def check_loop_depth(self, node, current_depth):
            nonlocal max_loop_depth
            max_loop_depth = max(max_loop_depth, current_depth)
            for child in ast.iter_child_nodes(node):
                if isinstance(child, (ast.For, ast.While)):
                    self.check_loop_depth(child, current_depth + 1)

    # Run the visitor
    visitor = ComplexityVisitor()
    visitor.visit(tree)

    # Scoring Logic
    if score < 2:
        # Increase score if we found nested loops or O(n^3) ops
        if max_loop_depth >= 2 or found_heavy_ops:
            score += 1
    
    return min(int(score), 2)