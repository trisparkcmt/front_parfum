from django.db.models import Count, Q

def get_similar_products(instance, model, tag_field='tags', limit=4):
    if not instance.pk:
        return model.objects.none()
    tags_manager = getattr(instance, tag_field, None)
    if tags_manager is None:
        return model.objects.none()
    tag_ids = tags_manager.values_list('id', flat=True)
    if not tag_ids:
        return model.objects.none()
    return model.objects.filter(actif=True).exclude(pk=instance.pk)\
        .filter(**{f'{tag_field}__id__in': tag_ids})\
        .annotate(communs=Count(tag_field, filter=Q(**{f'{tag_field}__id__in': tag_ids})))\
        .filter(communs__gt=0)\
        .order_by('-communs', '-date_creation')[:limit]
