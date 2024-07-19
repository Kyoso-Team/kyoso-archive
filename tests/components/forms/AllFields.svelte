<script lang="ts">
  import * as f from '$lib/form-validation';
  import { Form, Text } from '$components/form';
  import { createForm } from '$stores';

  const form = createForm({
    text: f.string([f.maxStrLength(5)]),
    longText: f.string([f.maxStrLength(100)])
  });
  const labels = form.labels;
</script>

<Form submit={() => {}}>
  <Text {form} label={labels.text} legend="Text field" />
  <span aria-label={`value-${labels.text}`}>{$form.value.text}</span>
  <Text {form} label={labels.longText} legend="Long text field" long />
</Form>
