import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, PromotionItem, PromotionInput, PromotionRuleInput } from '../../../../lib/api';
import { colors, radius, space } from '../../../../theme';
import { Ionicons } from '@expo/vector-icons';

type ViewMode = 'list' | 'create' | 'edit';

export default function OwnerPromotions() {
  const params = useLocalSearchParams<{ id: string }>();
  const kioskId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [rewardType, setRewardType] = useState<'FREE_PRODUCT' | 'DISCOUNT_PCT' | 'DISCOUNT_AMOUNT' | 'TWO_FOR_ONE'>('FREE_PRODUCT');
  const [rewardValue, setRewardValue] = useState('');
  const [rewardProduct, setRewardProduct] = useState('');

  // Rules state
  const [rules, setRules] = useState<Array<{
    type: 'FREQUENCY' | 'AMOUNT' | 'PRODUCTS';
    minVisits?: string;
    minAmount?: string;
    windowDays?: string;
    products?: string; // Comma separated in UI
  }>>([]);

  // Audience state
  const [audienceDays, setAudienceDays] = useState<number[]>([]); // 0 = Sunday, etc.
  const [audienceFromHour, setAudienceFromHour] = useState('');
  const [audienceToHour, setAudienceToHour] = useState('');

  // Limits / Caps state
  const [capPerPlayer, setCapPerPlayer] = useState('');
  const [capPerPeriod, setCapPerPeriod] = useState('');
  const [capTotal, setCapTotal] = useState('');
  const [periodDays, setPeriodDays] = useState('');

  // Validity dates
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  useEffect(() => {
    if (kioskId) {
      loadPromotions();
    }
  }, [kioskId]);

  async function loadPromotions() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.ownerKioskPromotions(kioskId);
      setPromotions(data);
    } catch (e: any) {
      console.error('[OwnerPromotions] loadPromotions error:', e);
      setError(e?.message ?? 'Error al cargar las promociones');
    } finally {
      setLoading(false);
    }
  }

  function handleAddRule() {
    setRules([...rules, { type: 'FREQUENCY', minVisits: '1', windowDays: '' }]);
  }

  function handleRemoveRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  function handleRuleChange(index: number, field: string, val: string) {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: val };
    setRules(updated);
  }

  function toggleAudienceDay(day: number) {
    if (audienceDays.includes(day)) {
      setAudienceDays(audienceDays.filter((d) => d !== day));
    } else {
      setAudienceDays([...audienceDays, day].sort());
    }
  }

  function formatRuleText(rule: any) {
    if (rule.type === 'FREQUENCY') {
      const visits = rule.minVisits ?? 1;
      const days = rule.windowDays;
      return `${visits} ${visits === 1 ? 'visita' : 'visitas'}${days ? ` en ${days} días` : ''}`;
    }
    if (rule.type === 'AMOUNT') {
      const amount = rule.minAmount ?? 0;
      const days = rule.windowDays;
      return `Compra mínima de $${amount}${days ? ` en ${days} días` : ''}`;
    }
    if (rule.type === 'PRODUCTS') {
      const prods = Array.isArray(rule.products) ? rule.products : [];
      return `Llevar alguno de: ${prods.join(', ') || 'Cualquier producto'}`;
    }
    return 'Regla desconocida';
  }

  function formatRewardText(promo: any) {
    const valueStr = promo.rewardValue !== null ? String(promo.rewardValue) : '';
    const productStr = promo.rewardProduct ? ` de ${promo.rewardProduct}` : '';

    if (promo.rewardType === 'FREE_PRODUCT') {
      return `Producto gratis: ${promo.rewardProduct ?? 'Especificado en canje'}`;
    }
    if (promo.rewardType === 'DISCOUNT_PCT') {
      return `${valueStr}% de descuento${productStr}`;
    }
    if (promo.rewardType === 'DISCOUNT_AMOUNT') {
      return `$${valueStr} de descuento${productStr}`;
    }
    if (promo.rewardType === 'TWO_FOR_ONE') {
      return `2x1${productStr}`;
    }
    return 'Beneficio';
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setActive(true);
    setRewardType('FREE_PRODUCT');
    setRewardValue('');
    setRewardProduct('');
    setRules([]);
    setAudienceDays([]);
    setAudienceFromHour('');
    setAudienceToHour('');
    setCapPerPlayer('');
    setCapPerPeriod('');
    setCapTotal('');
    setPeriodDays('');
    setStartsAt('');
    setEndsAt('');
    setError(null);
  }

  function startCreate() {
    resetForm();
    setView('create');
  }

  function startEdit(promo: PromotionItem) {
    setError(null);
    setEditingPromoId(promo.id);
    setTitle(promo.title);
    setDescription(promo.description ?? '');
    setActive(promo.active ?? true);
    setRewardType(promo.rewardType);
    setRewardValue(promo.rewardValue !== null ? String(promo.rewardValue) : '');
    setRewardProduct(promo.rewardProduct ?? '');

    // Rules
    setRules(promo.rules.map(r => ({
      type: r.type,
      minVisits: r.minVisits !== undefined ? String(r.minVisits) : '',
      minAmount: r.minAmount !== undefined ? String(r.minAmount) : '',
      windowDays: r.windowDays !== undefined ? String(r.windowDays) : '',
      products: Array.isArray(r.products) ? r.products.join(', ') : '',
    })));

    // Audience
    setAudienceDays(promo.audienceDays ?? []);
    setAudienceFromHour(promo.audienceFromHour !== null ? String(promo.audienceFromHour) : '');
    setAudienceToHour(promo.audienceToHour !== null ? String(promo.audienceToHour) : '');

    // Caps
    setCapPerPlayer(promo.capPerPlayer !== null ? String(promo.capPerPlayer) : '');
    setCapPerPeriod(promo.capPerPeriod !== null ? String(promo.capPerPeriod) : '');
    setCapTotal(promo.capTotal !== null ? String(promo.capTotal) : '');
    setPeriodDays(promo.periodDays !== null ? String(promo.periodDays) : '');

    // Validity dates
    setStartsAt(promo.startsAt ? promo.startsAt.substring(0, 10) : '');
    setEndsAt(promo.endsAt ? promo.endsAt.substring(0, 10) : '');

    setView('edit');
  }

  async function handleToggle(id: string, currentVal: boolean) {
    try {
      setError(null);
      await api.ownerTogglePromotion(id, !currentVal);
      setPromotions(promotions.map(p => p.id === id ? { ...p, active: !currentVal } : p));
    } catch (e: any) {
      console.error('[OwnerPromotions] handleToggle error:', e);
      setError(e?.message ?? 'Error al modificar estado');
    }
  }

  async function handleDelete(id: string) {
    const performDelete = async () => {
      try {
        setError(null);
        await api.ownerDeletePromotion(id);
        setPromotions(promotions.filter(p => p.id !== id));
      } catch (e: any) {
        console.error('[OwnerPromotions] handleDelete error:', e);
        setError(e?.message ?? 'Error al borrar promoción');
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('¿Estás seguro de que querés eliminar esta promoción? Se eliminarán también las reglas y canjes pendientes asociados.');
      if (confirmDelete) performDelete();
    } else {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que querés eliminar esta promoción? Se eliminarán también las reglas y canjes pendientes asociados.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', onPress: performDelete, style: 'destructive' }
        ]
      );
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (rules.length === 0) {
      setError('Debés agregar al menos una regla para la promoción');
      return;
    }

    // Validations & Parsing
    const parsedRules: PromotionRuleInput[] = [];
    try {
      rules.forEach((r, index) => {
        if (r.type === 'FREQUENCY') {
          const visits = parseInt(r.minVisits ?? '');
          if (isNaN(visits) || visits <= 0) {
            throw new Error(`Regla #${index + 1}: Cantidad de visitas inválida`);
          }
          parsedRules.push({
            type: 'FREQUENCY',
            minVisits: visits,
            windowDays: r.windowDays ? parseInt(r.windowDays) : undefined,
          });
        } else if (r.type === 'AMOUNT') {
          const amount = parseFloat(r.minAmount ?? '');
          if (isNaN(amount) || amount < 0) {
            throw new Error(`Regla #${index + 1}: Monto mínimo inválido`);
          }
          parsedRules.push({
            type: 'AMOUNT',
            minAmount: amount,
            windowDays: r.windowDays ? parseInt(r.windowDays) : undefined,
          });
        } else { // PRODUCTS
          const prodList = (r.products ?? '').split(',').map(p => p.trim()).filter(Boolean);
          if (prodList.length === 0) {
            throw new Error(`Regla #${index + 1}: Debés especificar al menos un producto`);
          }
          parsedRules.push({
            type: 'PRODUCTS',
            products: prodList,
          });
        }
      });
    } catch (err: any) {
      setError(err.message);
      return;
    }

    let valNum: number | null = null;
    if (rewardType === 'DISCOUNT_PCT' || rewardType === 'DISCOUNT_AMOUNT') {
      valNum = parseFloat(rewardValue);
      if (isNaN(valNum) || valNum <= 0) {
        setError('El valor de la recompensa debe ser un número positivo');
        return;
      }
    }

    // Form payload
    const body: PromotionInput = {
      kioskId,
      title: title.trim(),
      description: description.trim() || undefined,
      active,
      rewardType,
      rewardValue: valNum,
      rewardProduct: rewardProduct.trim() || null,
      audienceDays: audienceDays.length > 0 ? audienceDays : undefined,
      audienceFromHour: audienceFromHour ? parseInt(audienceFromHour) : null,
      audienceToHour: audienceToHour ? parseInt(audienceToHour) : null,
      capPerPlayer: capPerPlayer ? parseInt(capPerPlayer) : null,
      capPerPeriod: capPerPeriod ? parseInt(capPerPeriod) : null,
      capTotal: capTotal ? parseInt(capTotal) : null,
      periodDays: periodDays ? parseInt(periodDays) : null,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      rules: parsedRules,
    };

    // Validar caps periódicos
    if (body.capPerPeriod !== null && body.periodDays === null) {
      setError('Si definís un límite por período, debés indicar la duración del período en días');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (view === 'create') {
        const newPromo = await api.ownerCreatePromotion(body);
        setPromotions([newPromo, ...promotions]);
      } else {
        const updatedPromo = await api.ownerUpdatePromotion(editingPromoId!, body);
        setPromotions(promotions.map(p => p.id === editingPromoId ? updatedPromo : p));
      }

      setView('list');
    } catch (e: any) {
      console.error('[OwnerPromotions] onSubmit error:', e);
      setError(e?.message ?? 'Error al guardar promoción');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando promociones...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => view === 'list' ? router.back() : setView('list')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>
            {view === 'list' ? 'Promociones' : view === 'create' ? 'Nueva Promoción' : 'Editar Promoción'}
          </Text>
          {view === 'list' && (
            <Pressable onPress={startCreate} style={styles.addBtn} testID="add-promotion-btn">
              <Ionicons name="add" size={24} color={colors.white} />
            </Pressable>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* List View */}
        {view === 'list' && (
          <ScrollView contentContainerStyle={{ paddingBottom: space.xl }} style={styles.list}>
            {promotions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="pricetags-outline" size={64} color={colors.muted} />
                <Text style={styles.emptyTitle}>Sin promociones</Text>
                <Text style={styles.emptySubtitle}>Este kiosco todavía no tiene promociones configuradas.</Text>
                <Pressable onPress={startCreate} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Crear la primera</Text>
                </Pressable>
              </View>
            ) : (
              promotions.map((promo) => (
                <View key={promo.id} style={[styles.card, !promo.active && styles.cardInactive]} testID={`promo-card-${promo.id}`}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{promo.title}</Text>
                      {promo.description ? (
                        <Text style={styles.cardDesc}>{promo.description}</Text>
                      ) : null}
                    </View>
                    <Switch
                      value={promo.active}
                      onValueChange={() => handleToggle(promo.id, promo.active ?? true)}
                      trackColor={{ false: colors.border, true: colors.primarySoft }}
                      thumbColor={promo.active ? colors.primary : colors.muted}
                      testID={`promo-toggle-${promo.id}`}
                    />
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.rewardLabel}>Beneficio:</Text>
                    <Text style={styles.rewardValueText}>{formatRewardText(promo)}</Text>

                    <Text style={styles.rulesLabel}>Reglas (AND):</Text>
                    {promo.rules.map((rule, idx) => (
                      <View key={rule.id ?? idx} style={styles.ruleBadge}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                        <Text style={styles.ruleText}>{formatRuleText(rule)}</Text>
                      </View>
                    ))}

                    {(promo.startsAt || promo.endsAt) && (
                      <View style={styles.validityContainer}>
                        <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                        <Text style={styles.validityText}>
                          Vigencia:{' '}
                          {promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : 'Inicio'} al{' '}
                          {promo.endsAt ? new Date(promo.endsAt).toLocaleDateString() : 'Fin'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable onPress={() => startEdit(promo)} style={styles.editCardBtn} testID={`promo-edit-${promo.id}`}>
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                      <Text style={styles.editCardText}>Editar</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(promo.id)} style={styles.deleteCardBtn} testID={`promo-delete-${promo.id}`}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={styles.deleteCardText}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Form View (Create / Edit) */}
        {view !== 'list' && (
          <ScrollView contentContainerStyle={styles.formContainer} style={styles.form}>
            {/* Sección 1: Datos Básicos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos Básicos</Text>
              <Text style={styles.label}>Título de la Promoción *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Promo Frecuencia Gaseosas"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                testID="form-title-input"
              />
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Canjeá una Coca de 500ml tras visitarnos 3 veces"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                testID="form-description-input"
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>¿Promoción activa desde el inicio?</Text>
                <Switch
                  value={active}
                  onValueChange={setActive}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={active ? colors.primary : colors.muted}
                  testID="form-active-switch"
                />
              </View>
            </View>

            {/* Sección 2: Recompensa */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recompensa</Text>
              <Text style={styles.label}>Tipo de Recompensa</Text>
              <View style={styles.selectorGrid}>
                {([
                  { key: 'FREE_PRODUCT', label: 'Gratis' },
                  { key: 'DISCOUNT_PCT', label: '% Desc' },
                  { key: 'DISCOUNT_AMOUNT', label: '$ Desc' },
                  { key: 'TWO_FOR_ONE', label: '2x1' },
                ] as const).map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setRewardType(opt.key)}
                    style={[styles.selectorBtn, rewardType === opt.key && styles.selectorBtnSelected]}
                    testID={`form-reward-${opt.key}`}
                  >
                    <Text style={[styles.selectorBtnText, rewardType === opt.key && styles.selectorBtnTextSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(rewardType === 'DISCOUNT_PCT' || rewardType === 'DISCOUNT_AMOUNT') && (
                <>
                  <Text style={styles.label}>Valor del Descuento *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={rewardType === 'DISCOUNT_PCT' ? "Ej: 15" : "Ej: 500"}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={rewardValue}
                    onChangeText={setRewardValue}
                    testID="form-reward-value-input"
                  />
                </>
              )}

              <Text style={styles.label}>Producto de Recompensa (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Coca-Cola 500ml"
                placeholderTextColor={colors.muted}
                value={rewardProduct}
                onChangeText={setRewardProduct}
                testID="form-reward-product-input"
              />
            </View>

            {/* Sección 3: Reglas del Motor */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Reglas (AND)</Text>
                <Pressable onPress={handleAddRule} style={styles.addRuleBtn} testID="form-add-rule-btn">
                  <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.addRuleBtnText}>Agregar</Text>
                </Pressable>
              </View>

              {rules.length === 0 ? (
                <Text style={styles.noRulesText} testID="no-rules-text">Aún no agregaste reglas. Las promociones necesitan al menos una regla.</Text>
              ) : (
                rules.map((rule, idx) => (
                  <View key={idx} style={styles.ruleCard} testID={`rule-card-${idx}`}>
                    <View style={styles.ruleCardHeader}>
                      <Text style={styles.ruleCardTitle}>Regla #{idx + 1}</Text>
                      <Pressable onPress={() => handleRemoveRule(idx)} testID={`rule-remove-${idx}`}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>
                    </View>

                    <Text style={styles.label}>Tipo de Condición</Text>
                    <View style={styles.selectorGridCompact}>
                      {(['FREQUENCY', 'AMOUNT', 'PRODUCTS'] as const).map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => handleRuleChange(idx, 'type', type)}
                          style={[styles.selectorBtnCompact, rule.type === type && styles.selectorBtnSelected]}
                          testID={`rule-type-${idx}-${type}`}
                        >
                          <Text style={[styles.selectorBtnTextCompact, rule.type === type && styles.selectorBtnTextSelected]}>
                            {type === 'FREQUENCY' ? 'Visitas' : type === 'AMOUNT' ? 'Monto' : 'Productos'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {rule.type === 'FREQUENCY' && (
                      <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: space.sm }}>
                          <Text style={styles.label}>Visitas Mínimas *</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={rule.minVisits}
                            onChangeText={(val) => handleRuleChange(idx, 'minVisits', val)}
                            testID={`rule-visits-input-${idx}`}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: space.sm }}>
                          <Text style={styles.label}>Ventana Días (opcional)</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: 7"
                            placeholderTextColor={colors.muted}
                            keyboardType="numeric"
                            value={rule.windowDays}
                            onChangeText={(val) => handleRuleChange(idx, 'windowDays', val)}
                            testID={`rule-window-input-${idx}`}
                          />
                        </View>
                      </View>
                    )}

                    {rule.type === 'AMOUNT' && (
                      <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: space.sm }}>
                          <Text style={styles.label}>Monto Compra Mínimo *</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={rule.minAmount}
                            onChangeText={(val) => handleRuleChange(idx, 'minAmount', val)}
                            testID={`rule-amount-input-${idx}`}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: space.sm }}>
                          <Text style={styles.label}>Ventana Días (opcional)</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: 30"
                            placeholderTextColor={colors.muted}
                            keyboardType="numeric"
                            value={rule.windowDays}
                            onChangeText={(val) => handleRuleChange(idx, 'windowDays', val)}
                            testID={`rule-window-input-${idx}`}
                          />
                        </View>
                      </View>
                    )}

                    {rule.type === 'PRODUCTS' && (
                      <>
                        <Text style={styles.label}>Productos requeridos (separados por coma) *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Ej: Coca-Cola, Alfajor, Agua"
                          placeholderTextColor={colors.muted}
                          value={rule.products}
                          onChangeText={(val) => handleRuleChange(idx, 'products', val)}
                          testID={`rule-products-input-${idx}`}
                        />
                      </>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Sección 4: Audiencia */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audiencia (Opcional)</Text>
              <Text style={styles.label}>Días hábiles de la promoción</Text>
              <View style={styles.daysRow}>
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayLabel, index) => {
                  const selected = audienceDays.includes(index);
                  return (
                    <Pressable
                      key={index}
                      onPress={() => toggleAudienceDay(index)}
                      style={[styles.dayCircle, selected && styles.dayCircleSelected]}
                      testID={`form-day-${index}`}
                    >
                      <Text style={[styles.dayCircleText, selected && styles.dayCircleTextSelected]}>
                        {dayLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.daysHelp}>Si no marcas ninguno, se aplicará todos los días.</Text>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: space.sm }}>
                  <Text style={styles.label}>Hora de Inicio (0-23)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 8"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={2}
                    value={audienceFromHour}
                    onChangeText={setAudienceFromHour}
                    testID="form-from-hour-input"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  <Text style={styles.label}>Hora de Fin (0-23)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 20"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={2}
                    value={audienceToHour}
                    onChangeText={setAudienceToHour}
                    testID="form-to-hour-input"
                  />
                </View>
              </View>
            </View>

            {/* Sección 5: Límites y Vigencia */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Límites y Vigencia (Opcional)</Text>

              <Text style={styles.label}>Límite Total de Canjes (Stock Global)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 100"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={capTotal}
                onChangeText={setCapTotal}
                testID="form-cap-total-input"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: space.sm }}>
                  <Text style={styles.label}>Límite por Jugador</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 3"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={capPerPlayer}
                    onChangeText={setCapPerPlayer}
                    testID="form-cap-player-input"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: space.sm }}>
                  <Text style={styles.label}>Límite por Período</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 1"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={capPerPeriod}
                    onChangeText={setCapPerPeriod}
                    testID="form-cap-period-input"
                  />
                </View>
              </View>

              {capPerPeriod ? (
                <>
                  <Text style={styles.label}>Días del Período *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 7 (significa 1 canje cada 7 días)"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={periodDays}
                    onChangeText={setPeriodDays}
                    testID="form-period-days-input"
                  />
                </>
              ) : null}

              <Text style={styles.label}>Fecha de Inicio (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 2026-06-01"
                placeholderTextColor={colors.muted}
                value={startsAt}
                onChangeText={setStartsAt}
                testID="form-starts-at-input"
              />

              <Text style={styles.label}>Fecha de Fin (AAAA-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 2026-12-31"
                placeholderTextColor={colors.muted}
                value={endsAt}
                onChangeText={setEndsAt}
                testID="form-ends-at-input"
              />
            </View>

            <Pressable
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={saving}
              testID="form-submit-btn"
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {view === 'create' ? 'Crear Promoción' : 'Guardar Cambios'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.muted, marginTop: space.md, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card, minHeight: 60 },
  backBtn: { padding: space.xs, marginRight: space.sm },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1 },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, padding: space.xs + 2 },
  errorContainer: { flexDirection: 'row', backgroundColor: '#FEE2E2', padding: space.md, margin: space.md, borderRadius: radius.sm, alignItems: 'center', gap: space.sm },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600', flex: 1 },
  list: { flex: 1, padding: space.md },
  emptyContainer: { flex: 1, padding: space.xxl, justifyContent: 'center', alignItems: 'center', marginTop: space.xxl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: space.md },
  emptySubtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: space.xs, marginBottom: space.xl },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: space.xl, paddingVertical: space.md, borderRadius: radius.md },
  emptyBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, marginBottom: space.md, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.sm },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.muted, marginTop: space.xs },
  cardInfo: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm, marginTop: space.xs },
  rewardLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  rewardValueText: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: space.sm, marginTop: 2 },
  rulesLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: space.xs },
  ruleBadge: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs },
  ruleText: { fontSize: 14, color: colors.text },
  validityContainer: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm },
  validityText: { fontSize: 12, color: colors.muted },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.md, marginTop: space.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm },
  editCardBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.xs },
  editCardText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  deleteCardBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.xs },
  deleteCardText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  form: { flex: 1 },
  formContainer: { padding: space.md, paddingBottom: space.xxl },
  section: { backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, marginBottom: space.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: space.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: space.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: space.sm, marginBottom: space.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md - 2, fontSize: 16, color: colors.text, backgroundColor: colors.bg },
  textArea: { height: 70, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.md },
  switchLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  selectorGrid: { flexDirection: 'row', gap: space.xs, marginTop: space.xs, marginBottom: space.sm },
  selectorBtn: { flex: 1, backgroundColor: colors.bg, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  selectorBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectorBtnText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  selectorBtnTextSelected: { color: colors.white },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: space.xs },
  addRuleBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  addRuleBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  noRulesText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginVertical: space.md },
  ruleCard: { backgroundColor: colors.bg, padding: space.md, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: colors.primary, marginBottom: space.md },
  ruleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  ruleCardTitle: { fontSize: 14, fontWeight: '700', color: colors.navy },
  selectorGridCompact: { flexDirection: 'row', gap: space.xs, marginTop: space.xs, marginBottom: space.xs },
  selectorBtnCompact: { flex: 1, backgroundColor: colors.card, paddingVertical: space.xs + 2, borderRadius: radius.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  selectorBtnTextCompact: { fontSize: 12, color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: space.sm },
  dayCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dayCircleSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayCircleText: { fontSize: 14, fontWeight: '700', color: colors.text },
  dayCircleTextSelected: { color: colors.white },
  daysHelp: { fontSize: 12, color: colors.muted, marginBottom: space.sm },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: space.md, borderRadius: radius.md, alignItems: 'center', marginTop: space.md },
  submitBtnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
