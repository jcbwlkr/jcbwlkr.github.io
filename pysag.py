exclude_dirs += ['_layouts']
exclude_files += ['pysag.py', 'publish.sh', 'tag_cloud_info.txt']

data_pages = {
    "projects": {
        "variable": "project",
        "directory": "portfolio",
        "file": "{{ project._id }}.html",
        "template": "_layouts/project.html"
    },
    "posts": {
        "variable": "post",
        "directory": "blog",
        "file": "{{ post._id }}.html",
        "template": "_layouts/post.html"
    }
}
